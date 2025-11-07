
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { updateOrderStatus, deductStockForOrder, getOrderById } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';

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
    const paymentData = await payment.get({ id: paymentId });
    
    console.log('Payment details:', {
      id: paymentData.id,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      external_reference: paymentData.external_reference,
    });

    if (!paymentData.external_reference) {
        console.warn(`Payment ${paymentId} is missing an external_reference. Cannot process order.`);
        return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    const orderId = parseInt(paymentData.external_reference, 10);
    const order = await getOrderById(orderId);

    if (!order) {
        console.error(`Order with ID ${orderId} not found.`);
        return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // Prevent processing already completed orders
    if (order.status === 'paid' || order.status === 'delivered') {
        console.log(`Order ${orderId} has already been processed. Skipping.`);
        return NextResponse.json({ received: true }, { status: 200 });
    }

    let newStatus: OrderStatus;

    switch (paymentData.status) {
      case 'approved':
        newStatus = 'paid';
        console.log(`Payment ${paymentId} approved for order ${orderId}. Updating status and deducting stock.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        await deductStockForOrder(orderId);
        break;
        
      case 'in_process':
      case 'pending':
        newStatus = 'pending';
        console.log(`Payment ${paymentId} is pending for order ${orderId}. Updating status.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        break;
        
      case 'rejected':
        newStatus = 'failed';
        console.log(`Payment ${paymentId} rejected for order ${orderId}. Updating status.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        // No restock is needed because stock was never deducted.
        break;
        
      case 'cancelled':
        newStatus = 'cancelled';
        console.log(`Payment ${paymentId} cancelled for order ${orderId}. Updating status.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        // No restock is needed.
        break;
        
      default:
        console.log(`Ignoring unhandled payment status '${paymentData.status}' for payment ${paymentId}.`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 200 });
  }
}
