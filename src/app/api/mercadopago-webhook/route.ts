
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { updateOrderStatus, deductStockForOrder, getOrderByPaymentId, getOrderById } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';
import crypto from 'crypto';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

// Función para verificar la firma de Mercado Pago
async function verifySignature(request: NextRequest, rawBody: string): Promise<boolean> {
    // FIX 1: Check for the secret inside the function
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) {
        console.error('[WEBHOOK] CRITICAL: MERCADOPAGO_WEBHOOK_SECRET is not defined.');
        return false;
    }

    const signatureHeader = request.headers.get('x-signature');
    if (!signatureHeader) {
        console.error('[WEBHOOK] Missing x-signature header');
        return false;
    }

    const parts = signatureHeader.split(',').reduce((acc, part) => {
        const [key, value] = part.split('=');
        acc[key.trim()] = value.trim();
        return acc;
    }, {} as Record<string, string>);

    const timestamp = parts['ts'];
    const signature = parts['v1'];

    if (!timestamp || !signature) {
        console.error('[WEBHOOK] Invalid signature header format');
        return false;
    }

    const manifest = `id:${(JSON.parse(rawBody)).data.id};request-id:${request.headers.get('x-request-id')};ts:${timestamp};`;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const computedSignature = hmac.digest('hex');
    
    return crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  console.log('[WEBHOOK] Invoked. Method:', request.method);

  try {
    const rawBody = await request.text();
    console.log('[WEBHOOK] Raw body received:', rawBody);

    if (!rawBody) {
        console.log('[WEBHOOK] Ignoring notification: Empty body.');
        return NextResponse.json({ received: true, message: "Empty body." });
    }
    
    const isSignatureValid = await verifySignature(request, rawBody);
    if (!isSignatureValid) {
        console.error('[WEBHOOK] INVALID SIGNATURE. Request ignored.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
    console.log('[WEBHOOK] Signature validated successfully.');

    const body = JSON.parse(rawBody);

    if (body.type !== 'payment') {
      console.log('[WEBHOOK] Ignoring notification: Not a payment update.');
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data.id;
    const payment = new Payment(client);
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

    // Si la orden ya está pagada o en un estado final, no hacemos nada.
    if (order.status === 'paid' || order.status === 'delivered' || order.status === 'shipped') {
        console.log(`[WEBHOOK] Order ${orderId} is already in a final state ('${order.status}'). No update needed.`);
        return NextResponse.json({ received: true });
    }

    let newStatus: OrderStatus | null = null;
    
    // FIX 2: Removed redundant 'order.status !== 'paid'' check.
    if (paymentData.status === 'approved') {
        newStatus = 'paid';
        console.log(`[WEBHOOK] Updating order ${orderId} to 'paid'.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        await deductStockForOrder(orderId);
    } else if ((paymentData.status === 'rejected' || paymentData.status === 'cancelled') && order.status !== 'failed' && order.status !== 'cancelled') {
        newStatus = paymentData.status === 'rejected' ? 'failed' : 'cancelled';
        console.log(`[WEBHOOK] Updating order ${orderId} to '${newStatus}'.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
    } else {
        console.log(`[WEBHOOK] Ignoring unhandled or duplicate status '${paymentData.status}' for order ${orderId} with status '${order.status}'.`);
    }
    
    console.log(`[WEBHOOK] Process finished for payment ${paymentId}.`);
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    console.error('[WEBHOOK] CRITICAL ERROR:', { message: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Webhook processing failed but acknowledging receipt.' }, { status: 200 });
  }
}
