
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { updateOrderStatus, deductStockForOrder, getOrderByPaymentId, getOrderById } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';
import crypto from 'crypto';

// Función para verificar la firma de Mercado Pago (sin cambios)
async function verifySignature(request: NextRequest, rawBody: string): Promise<boolean> {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) {
        console.error('[WEBHOOK] CRITICAL: MERCADOPAGO_WEBHOOK_SECRET is not defined.');
        return false;
    }
    const signatureHeader = request.headers.get('x-signature');
    if (!signatureHeader) { return false; }

    const parts = signatureHeader.split(',').reduce((acc, part) => {
        const [key, value] = part.split('=');
        acc[key.trim()] = value.trim();
        return acc;
    }, {} as Record<string, string>);

    const timestamp = parts['ts'];
    const signature = parts['v1'];
    if (!timestamp || !signature) { return false; }

    const manifest = `id:${(JSON.parse(rawBody)).data.id};request-id:${request.headers.get('x-request-id')};ts:${timestamp};`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const computedSignature = hmac.digest('hex');
    
    return crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  console.log('[WEBHOOK] Invoked. Method:', request.method);

  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error('MERCADOPAGO_ACCESS_TOKEN is not defined.');
    }

    const client = new MercadoPagoConfig({ accessToken });

    const rawBody = await request.text();
    if (!rawBody) {
        console.log('[WEBHOOK] Ignoring: Empty body.');
        return NextResponse.json({ received: true });
    }
    
    const isSignatureValid = await verifySignature(request, rawBody);
    if (!isSignatureValid) {
        console.error('[WEBHOOK] INVALID SIGNATURE. Request ignored.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
    console.log('[WEBHOOK] Signature validated.');

    const body = JSON.parse(rawBody);

    if (body.type !== 'payment') {
      console.log('[WEBHOOK] Ignoring: Not a payment update.');
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data.id;
    const paymentClient = new Payment(client);
    const paymentData = await paymentClient.get({ id: paymentId });
    
    console.log(`[WEBHOOK] Fetched payment ${paymentId} with status ${paymentData.status}.`);

    let order = await getOrderByPaymentId(String(paymentId));
    
    if (!order && paymentData.external_reference) {
        const orderIdFromRef = parseInt(paymentData.external_reference, 10);
        if (!isNaN(orderIdFromRef)) {
            order = await getOrderById(orderIdFromRef);
        }
    }

    if (!order) {
        console.error(`[WEBHOOK] CRITICAL: Order for payment ${paymentId} not found.`);
        return NextResponse.json({ received: true });
    }
    
    const orderId = order.id;

    // FIX: Add explicit check for order.status to satisfy TypeScript
    if (order.status && ['paid', 'delivered', 'shipped'].includes(order.status)) {
        console.log(`[WEBHOOK] Order ${orderId} already in final state ('${order.status}').`);
        return NextResponse.json({ received: true });
    }

    let newStatus: OrderStatus | null = null;
    
    if (paymentData.status === 'approved') {
        newStatus = 'paid';
        console.log(`[WEBHOOK] Updating order ${orderId} to 'paid'.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        await deductStockForOrder(orderId);
    // FIX: Add explicit check for order.status and paymentData.status to satisfy TypeScript
    } else if (order.status && paymentData.status && ['rejected', 'cancelled'].includes(paymentData.status) && !['failed', 'cancelled'].includes(order.status)) {
        newStatus = paymentData.status === 'rejected' ? 'failed' : 'cancelled';
        console.log(`[WEBHOOK] Updating order ${orderId} to '${newStatus}'.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
    } else {
        console.log(`[WEBHOOK] Ignoring status '${paymentData.status}' for order ${orderId}.`);
    }
    
    console.log(`[WEBHOOK] Process finished for payment ${paymentId}.`);
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    console.error('[WEBHOOK] CRITICAL ERROR:', { message: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Webhook processing failed but acknowledging receipt.' }, { status: 200 });
  }
}
