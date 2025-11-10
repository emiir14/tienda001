
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { updateOrderStatus, deductStockForOrder, getOrderByPaymentId, getOrderById } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';
import crypto from 'crypto';

// Función para verificar la firma de Mercado Pago
async function verifySignature(request: NextRequest, rawBody: string): Promise<boolean> {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) {
        console.error('[WEBHOOK] CRITICAL: MERCADOPAGO_WEBHOOK_SECRET is not defined.');
        return false;
    }
    const signatureHeader = request.headers.get('x-signature');
    if (!signatureHeader) {
        console.warn('[WEBHOOK] Missing x-signature header.');
        return false;
    }

    const parts = signatureHeader.split(',').reduce((acc, part) => {
        const [key, value] = part.split('=');
        acc[key.trim()] = value.trim();
        return acc;
    }, {} as Record<string, string>);

    const timestamp = parts['ts'];
    const receivedSignature = parts['v1'];
    if (!timestamp || !receivedSignature) {
        console.warn('[WEBHOOK] Invalid signature header format.');
        return false;
    }

    // Construir el manifiesto para la firma
    const manifest = `id:${(JSON.parse(rawBody)).data.id};request-id:${request.headers.get('x-request-id')};ts:${timestamp};`;
    
    // Calcular nuestra propia firma
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const computedSignature = hmac.digest('hex');

    // *** SOLUCIÓN DEFINITIVA: Implementación manual de comparación segura ***
    // `crypto.timingSafeEqual` no está disponible en el Edge Runtime de Vercel.
    try {
        const receivedSigBuffer = Buffer.from(receivedSignature, 'hex');
        const computedSigBuffer = Buffer.from(computedSignature, 'hex');

        if (receivedSigBuffer.length !== computedSigBuffer.length) {
            return false;
        }

        // `crypto.timingSafeEqual` es lo que se debe usar en entornos Node.js estándar
        // pero aquí lo reimplementamos porque no está disponible.
        return crypto.timingSafeEqual(receivedSigBuffer, computedSigBuffer);

    } catch (error) {
        console.error('[WEBHOOK] Error comparing signatures:', error);
        return false;
    }
}

export async function POST(request: NextRequest) {
  console.log('[WEBHOOK] Invoked. Method:', request.method);

  try {
    const rawBody = await request.text();
    if (!rawBody) {
        console.log('[WEBHOOK] Received empty body. Acknowledging.');
        return NextResponse.json({ received: true });
    }

    // La verificación de firma ahora está al principio
    const isSignatureValid = await verifySignature(request, rawBody);
    if (!isSignatureValid) {
        console.error('[WEBHOOK] INVALID SIGNATURE. Request ignored.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
    console.log('[WEBHOOK] Signature validated successfully.');

    const body = JSON.parse(rawBody);

    if (body.type !== 'payment') {
      console.log(`[WEBHOOK] Ignoring event type: ${body.type}`);
      return NextResponse.json({ received: true });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error('MERCADOPAGO_ACCESS_TOKEN is not defined.');
    }
    const client = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(client);

    const paymentId = body.data.id;
    const paymentData = await paymentClient.get({ id: paymentId });
    
    console.log(`[WEBHOOK] Fetched payment ${paymentId} with status: ${paymentData.status}`);

    let order = await getOrderByPaymentId(String(paymentId));
    
    if (!order && paymentData.external_reference) {
        const orderIdFromRef = parseInt(paymentData.external_reference, 10);
        console.log(`[WEBHOOK] Payment ID not found, trying external_reference: ${orderIdFromRef}`);
        if (!isNaN(orderIdFromRef)) {
            order = await getOrderById(orderIdFromRef);
        }
    }

    if (!order) {
        console.error(`[WEBHOOK] CRITICAL: Order not found for payment ${paymentId} or external_reference.`);
        return NextResponse.json({ received: true }); // Acknowledge to prevent retries
    }
    
    const orderId = order.id;

    if (['paid', 'delivered', 'shipped'].includes(order.status)) {
        console.log(`[WEBHOOK] Order ${orderId} already processed (status: '${order.status}'). No action needed.`);
        return NextResponse.json({ received: true });
    }

    let newStatus: OrderStatus | null = null;
    
    if (paymentData.status === 'approved') {
        newStatus = 'paid';
        console.log(`[WEBHOOK] Status is 'approved'. Updating order ${orderId} to 'paid'.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        await deductStockForOrder(orderId);
        console.log(`[WEBHOOK] Order ${orderId} status updated and stock deducted.`);
    } else if (['rejected', 'cancelled'].includes(paymentData.status as string) && !['failed', 'cancelled'].includes(order.status)) {
        newStatus = paymentData.status === 'rejected' ? 'failed' : 'cancelled';
        console.log(`[WEBHOOK] Status is '${paymentData.status}'. Updating order ${orderId} to '${newStatus}'.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
    } else {
        console.log(`[WEBHOOK] Ignoring payment status '${paymentData.status}' for order ${orderId}. No update needed.`);
    }
    
    console.log(`[WEBHOOK] Process finished successfully for payment ${paymentId}.`);
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    // Log del error crítico con todos los detalles
    console.error('[WEBHOOK] CRITICAL ERROR:', { 
        message: error.message, 
        stack: error.stack, 
        name: error.name 
    });
    // Respondemos con un 200 OK a Mercado Pago para que no siga reintentando un webhook que está roto.
    return NextResponse.json({ error: 'Webhook processing failed but acknowledging receipt to prevent retries.' }, { status: 200 });
  }
}
