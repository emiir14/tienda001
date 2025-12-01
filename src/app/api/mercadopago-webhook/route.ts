
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
// --- CORRECCIÓN: Importar directamente desde data.ts ---
import { updateOrderStatus, deductStockForOrder } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export async function POST(request: NextRequest) {
    console.log('[WEBHOOK] ✅ INCOMING NOTIFICATION');
    const body = await request.json();
    console.log('[WEBHOOK] Body received:', body);

    if (body.type === 'payment') {
        const paymentId = body.data.id as string;
        console.log(`[WEBHOOK] Received payment notification for ID: ${paymentId}.`);

        try {
            console.log(`[WEBHOOK] Fetching payment details for ID: ${paymentId}`);
            const payment = await new Payment(client).get({ id: paymentId });
            console.log('[WEBHOOK] Payment details fetched successfully.');

            const orderId = payment.external_reference;
            if (!orderId) {
                console.error('[WEBHOOK] CRITICAL: Payment is missing external_reference.', payment);
                return NextResponse.json({ error: 'External reference not found in payment' }, { status: 400 });
            }
            console.log(`[WEBHOOK] Order ID (external_reference): ${orderId}`);

            const orderIdNumber = Number(orderId);

            if (payment.status === 'approved') {
                console.log(`[WEBHOOK] Payment for order ${orderIdNumber} is approved.`);

                // --- PASO 1: Actualizar estado del pedido a 'paid' ---
                console.log(`[WEBHOOK] ==> Step 1: Updating order status to 'paid' for order ${orderIdNumber}.`);
                // --- CORRECCIÓN: Usar la función correcta de data.ts ---
                await updateOrderStatus(orderIdNumber, 'paid', paymentId);
                console.log(`[WEBHOOK] <== Step 1 complete.`);

                // --- PASO 2: Descontar stock ---
                try {
                    console.log(`[WEBHOOK] ==> Step 2: Deducting stock for order ${orderIdNumber}.`);
                    // --- CORRECCIÓN: Usar la función correcta de data.ts ---
                    await deductStockForOrder(orderIdNumber);
                    console.log(`[WEBHOOK] <== Step 2 complete.`);
                } catch (stockError: any) {
                    console.error(`[WEBHOOK] CRITICAL FAILURE IN STEP 2: Failed to deduct stock for order ${orderIdNumber}. MANUAL INTERVENTION REQUIRED.`, stockError);
                    // Opcional: Podrías intentar revertir el estado o notificar a un admin
                }

                console.log(`[WEBHOOK] ✅ Order ${orderIdNumber} processed successfully.`);
                return NextResponse.json({ success: true, orderId: orderIdNumber });

            } else {
                console.log(`[WEBHOOK] Payment for order ${orderIdNumber} is not approved. Status is: ${payment.status}.`);
                
                let newStatus: OrderStatus;
                if (payment.status === 'in_process' || payment.status === 'pending') {
                    newStatus = 'pending_payment';
                } else { // 'rejected', 'cancelled', 'refunded', etc.
                    newStatus = 'failed';
                }

                // --- CORRECCIÓN: Usar la función correcta de data.ts ---
                await updateOrderStatus(orderIdNumber, newStatus, paymentId);
                console.log(`[WEBHOOK] Order ${orderIdNumber} status updated to ${newStatus}.`);
                return NextResponse.json({ success: true, message: `Status updated to ${newStatus}` });
            }

        } catch (error: any) {
            console.error(`[WEBHOOK] 💥 GENERAL ERROR processing payment ${paymentId}:`, {
                message: error.message,
                stack: error.stack,
                cause: error.cause
            });
            return NextResponse.json({ error: 'Failed to process payment notification' }, { status: 500 });
        }
    }

    console.log("[WEBHOOK] Notification is not of type 'payment'. Ignoring.");
    return NextResponse.json({ success: true, message: 'Notification acknowledged' });
}
