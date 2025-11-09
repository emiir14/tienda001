
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { updateOrderStatus, deductStockForOrder, getOrderByPaymentId, getOrderById } from '@/lib/data'; // Asegúrate de importar getOrderByPaymentId
import type { OrderStatus } from '@/lib/types';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const payment = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[WEBHOOK] Received notification:', JSON.stringify(body, null, 2));

    if (body.type !== 'payment' || !body.data || !body.data.id) {
      console.log('[WEBHOOK] Ignoring notification: Not a valid payment update.');
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data.id;
    const paymentData = await payment.get({ id: paymentId });
    
    console.log(`[WEBHOOK] Fetched payment details for ${paymentId}:`, {
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference,
    });

    // --- INICIO DE LA LÓGICA MODIFICADA ---

    // Primero, intentamos obtener la orden usando el ID del pago (que es lo más común).
    // MP puede notificar sobre el `payment` o sobre el `merchant_order`. El `paymentId` es más fiable.
    let order = await getOrderByPaymentId(String(paymentId));
    
    // Si no la encontramos con el paymentId (quizás la notificación llegó antes de que actualizáramos la orden),
    // usamos el external_reference como un método de respaldo.
    if (!order && paymentData.external_reference) {
        console.log(`[WEBHOOK] Order not found by payment_id ${paymentId}. Trying fallback with external_reference: ${paymentData.external_reference}`);
        const orderIdFromRef = parseInt(paymentData.external_reference, 10);
        if (!isNaN(orderIdFromRef)) {
            order = await getOrderById(orderIdFromRef);
        }
    }

    if (!order) {
        console.error(`[WEBHOOK] CRITICAL: Order with payment_id ${paymentId} (or fallback ref) not found in database.`);
        return NextResponse.json({ received: true });
    }
    
    const orderId = order.id;

    // --- FIN DE LA LÓGICA MODIFICADA ---

    // Idempotency Check: Prevent processing an order that is already in a final state.
    if (order.status === 'paid' || order.status === 'delivered' || order.status === 'shipped' || order.status === 'failed' || order.status === 'cancelled') {
        console.log(`[WEBHOOK] Order ${orderId} is already in a final state ('${order.status}'). No update needed.`);
        return NextResponse.json({ received: true });
    }

    let newStatus: OrderStatus | null = null;

    switch (paymentData.status) {
      case 'approved':
        newStatus = 'paid';
        console.log(`[WEBHOOK] Payment ${paymentId} for order ${orderId} is 'approved'.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        console.log(`[WEBHOOK] DB updated. Now deducting stock for order ${orderId}.`);
        await deductStockForOrder(orderId);
        console.log(`[WEBHOOK] Stock deducted for order ${orderId}.`);
        break;
        
      case 'in_process':
      case 'pending':
        console.log(`[WEBHOOK] Payment ${paymentId} for order ${orderId} is '${paymentData.status}'. No action taken.`);
        break;
        
      case 'rejected':
        newStatus = 'failed';
        console.log(`[WEBHOOK] Payment ${paymentId} for order ${orderId} is 'rejected'.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        console.log(`[WEBHOOK] Successfully updated order ${orderId} status to 'failed' in DB.`);
        break;
        
      case 'cancelled':
        newStatus = 'cancelled';
        console.log(`[WEBHOOK] Payment ${paymentId} for order ${orderId} is 'cancelled'.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        console.log(`[WEBHOOK] Successfully updated order ${orderId} status to 'cancelled' in DB.`);
        break;
        
      default:
        console.log(`[WEBHOOK] Ignoring unhandled payment status '${paymentData.status}' for payment ${paymentId}.`);
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('[WEBHOOK] CRITICAL ERROR:', error);
    return NextResponse.json({ error: 'Webhook processing failed but acknowledging receipt to prevent retries.' }, { status: 200 });
  }
}
