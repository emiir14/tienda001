
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { updateOrderStatus, restockItemsForOrder, getOrderById, createOrderFromWebhook } from '@/lib/data';
import type { OrderStatus, Order } from '@/lib/types';
import { log } from 'console';

// Initialize MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const payment = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    if (body.type !== 'payment' || !body.data || !body.data.id) {
      console.log('Invalid or non-payment webhook data received');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const paymentId = body.data.id;
    
    // Get payment details from MercadoPago
    const paymentData = await payment.get({ id: paymentId });
    
    console.log('Payment details:', {
      id: paymentData.id,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      external_reference: paymentData.external_reference,
      transaction_amount: paymentData.transaction_amount
    });

    if (!paymentData.external_reference) {
        console.warn(`Payment ${paymentId} is missing an external_reference. Cannot process order.`);
        return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    const orderId = parseInt(paymentData.external_reference, 10);
    if(isNaN(orderId)) {
      console.warn(`Payment ${paymentId} has an invalid external_reference: ${paymentData.external_reference}. Cannot process order.`);
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }
    
    let newStatus: OrderStatus;

    // Check if the order already exists in our database
    let order: Order | undefined | null = await getOrderById(orderId);

    if (!order) {
      // If order doesn't exist, create it. This is a fallback for race conditions.
      console.log(`Order ${orderId} not found in DB. Creating from webhook.`);
      const { newOrder, error } = await createOrderFromWebhook(paymentData);
      if(error || !newOrder) {
        console.error(`Failed to create order ${orderId} from webhook: ${error}`);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
      }
      order = newOrder;
    }

    // Handle different payment statuses
    switch (paymentData.status) {
      case 'approved':
        newStatus = 'paid';
        console.log(`Payment ${paymentId} approved for order ${orderId}. Updating status to '${newStatus}'.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        break;
        
      case 'in_process':
      case 'pending':
        newStatus = 'pending';
        console.log(`Payment ${paymentId} is pending for order ${orderId}. Updating status to '${newStatus}'.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        break;
        
      case 'rejected':
        newStatus = 'failed';
        console.log(`Payment ${paymentId} rejected for order ${orderId}: ${paymentData.status_detail}. Updating status to '${newStatus}' and restoking items.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        await restockItemsForOrder(orderId);
        break;
        
      case 'cancelled':
        newStatus = 'cancelled';
        console.log(`Payment ${paymentId} cancelled for order ${orderId}. Updating status to '${newStatus}' and restoking items.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        await restockItemsForOrder(orderId);
        break;

      case 'refunded':
        newStatus = 'refunded';
        console.log(`Payment ${paymentId} refunded for order ${orderId}. Updating status to '${newStatus}' and restoking items.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        await restockItemsForOrder(orderId);
        break;
        
      default:
        console.log(`Ignoring unhandled payment status '${paymentData.status}' for payment ${paymentId}.`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent MercadoPago from retrying
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 200 });
  }
}
