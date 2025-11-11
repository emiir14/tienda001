
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { updateOrderStatusFromWebhook, deductStockFromWebhook } from '@/lib/webhook-db';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export async function POST(request: NextRequest) {
    console.log('[WEBHOOK] ✅ INCOMING NOTIFICATION');
    const body = await request.json();
    console.log('[WEBHOOK] Body received:', body);

    if (body.type === 'payment') {
        const paymentId = body.data.id as string;
        console.log(`[WEBHOOK] Received payment notification for ID: ${paymentId}.`);

        try {
            // CORRECT WAY: Fetch the payment directly using its ID
            console.log(`[WEBHOOK] Fetching payment details for ID: ${paymentId}`);
            const payment = await new Payment(client).get({ id: paymentId });
            console.log('[WEBHOOK] Payment details fetched successfully.');

            const orderId = payment.external_reference;
            if (!orderId) {
                console.error('[WEBHOOK] CRITICAL: Payment is missing external_reference.', payment);
                return NextResponse.json({ error: 'External reference not found in payment' }, { status: 400 });
            }
            console.log(`[WEBHOOK] Order ID (external_reference): ${orderId}`);

            if (payment.status === 'approved') {
                console.log(`[WEBHOOK] Payment for order ${orderId} is approved.`);

                // 1. Update order status to 'paid'
                console.log(`[WEBHOOK] ==> Step 1: Updating order status to 'paid' for order ${orderId}.`);
                await updateOrderStatusFromWebhook(Number(orderId), 'paid', paymentId);
                console.log(`[WEBHOOK] <== Step 1 complete.`);

                // 2. Deduct stock
                try {
                    console.log(`[WEBHOOK] ==> Step 2: Deducting stock for order ${orderId}.`);
                    await deductStockFromWebhook(Number(orderId));
                    console.log(`[WEBHOOK] <== Step 2 complete.`);
                } catch (stockError: any) {
                    console.error(`[WEBHOOK] CRITICAL FAILURE IN STEP 2: Failed to deduct stock for order ${orderId}. MANUAL INTERVENTION REQUIRED.`, stockError);
                }

                console.log(`[WEBHOOK] ✅ Order ${orderId} processed successfully.`);
                return NextResponse.json({ success: true, orderId });

            } else {
                console.log(`[WEBHOOK] Payment for order ${orderId} is not approved. Status is: ${payment.status}.`);
                // Map other Mercado Pago statuses to your app's statuses
                const newStatus = (payment.status === 'pending' || payment.status === 'in_process') ? 'pending' : 'failed';
                await updateOrderStatusFromWebhook(Number(orderId), newStatus, paymentId);
                console.log(`[WEBHOOK] Order ${orderId} status updated to ${newStatus}.`);
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

    // This console.log now uses double quotes to prevent syntax errors
    console.log("[WEBHOOK] Notification is not of type 'payment'. Ignoring.");
    return NextResponse.json({ success: true, message: 'Notification acknowledged' });
}
