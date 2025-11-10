
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { updateOrderStatus, deductStockForOrder, getOrderByPaymentId, getOrderById } from '@/lib/data'; // Asegúrate de importar getOrderByPaymentId
import type { OrderStatus } from '@/lib/types';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const payment = new Payment(client);

export async function POST(request: NextRequest) {
  // Log #1: ¡La función se ha iniciado!
  console.log('[WEBHOOK] Function invoked. Method:', request.method);
  
  // Log #2: Registrar las cabeceras para ver qué nos llega.
  const headers: { [key: string]: string } = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  console.log('[WEBHOOK] Incoming headers:', JSON.stringify(headers, null, 2));

  try {
    // Log #3: Intentando leer el cuerpo de la petición como texto.
    const rawBody = await request.text();
    console.log('[WEBHOOK] Raw body received:', rawBody);

    // Es crucial no dejar el body vacío antes de intentar parsearlo.
    if (!rawBody) {
        console.log('[WEBHOOK] Ignoring notification: Empty body.');
        return NextResponse.json({ received: true, message: "Empty body." });
    }
    
    const body = JSON.parse(rawBody);
    console.log('[WEBHOOK] Body parsed successfully:', JSON.stringify(body, null, 2));

    // --- El resto de tu código sigue igual desde aquí ---

    if (body.type !== 'payment' || !body.data || !body.data.id) {
      console.log('[WEBHOOK] Ignoring notification: Not a valid payment update.');
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data.id;
    const payment = new Payment(client); // client está definido arriba en tu archivo
    const paymentData = await payment.get({ id: paymentId });
    
    console.log(`[WEBHOOK] Fetched payment details for ${paymentId}:`, {
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference,
    });

    let order = await getOrderByPaymentId(String(paymentId));
    
    if (!order && paymentData.external_reference) {
        console.log(`[WEBHOOK] Order not found by payment_id. Trying fallback with external_reference: ${paymentData.external_reference}`);
        const orderIdFromRef = parseInt(paymentData.external_reference, 10);
        if (!isNaN(orderIdFromRef)) {
            order = await getOrderById(orderIdFromRef);
        }
    }

    if (!order) {
        console.error(`[WEBHOOK] CRITICAL: Order with payment_id ${paymentId} (or fallback ref) not found.`);
        return NextResponse.json({ received: true, message: "Order not found." });
    }
    
    const orderId = order.id;

    if (order.status === 'paid' || order.status === 'delivered' || order.status === 'shipped' || order.status === 'failed' || order.status === 'cancelled') {
        console.log(`[WEBHOOK] Order ${orderId} is already in a final state ('${order.status}'). No update needed.`);
        return NextResponse.json({ received: true });
    }

    let newStatus: OrderStatus | null = null;
    switch (paymentData.status) {
      case 'approved':
        newStatus = 'paid';
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        await deductStockForOrder(orderId);
        break;
      case 'rejected':
      case 'cancelled':
        newStatus = paymentData.status === 'rejected' ? 'failed' : 'cancelled';
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        break;
      default:
        console.log(`[WEBHOOK] Ignoring unhandled payment status '${paymentData.status}'.`);
    }
    
    console.log(`[WEBHOOK] Process finished for payment ${paymentId}.`);
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    // Log #4: Si algo falla, registra el error específico.
    console.error('[WEBHOOK] CRITICAL ERROR:', {
        message: error.message,
        stack: error.stack
    });
    // Aún así respondemos 200 OK para que MP no reintente.
    return NextResponse.json({ error: 'Webhook processing failed but acknowledging receipt.' }, { status: 200 });
  }
}

