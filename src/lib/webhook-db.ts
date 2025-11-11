
import { getDb, isDbConfigured } from './db';
import type { OrderStatus, OrderData } from './types';

// This file contains database functions specifically for the Mercado Pago webhook.
// It does NOT use 'use server' and can be safely imported into Route Handlers.

export async function updateOrderStatusFromWebhook(orderId: number, status: OrderStatus, paymentId?: string | null): Promise<void> {
    if (!isDbConfigured) {
        console.log(`[WEBHOOK-DB] Simulating order status update for order ${orderId} to ${status}`);
        return;
    }
    try {
        const db = getDb();
        console.log(`[WEBHOOK-DB] Updating order ${orderId} to status ${status} with payment ID ${paymentId}`);
        if (paymentId !== undefined) {
             await db`UPDATE orders SET status = ${status}, payment_id = COALESCE(${paymentId}, payment_id) WHERE id = ${orderId}`;
        } else {
             await db`UPDATE orders SET status = ${status} WHERE id = ${orderId}`;
        }
        console.log(`[WEBHOOK-DB] Successfully updated order ${orderId}.`);
    } catch (error) {
        console.error(`[WEBHOOK-DB] Database Error: Failed to update order status for order ${orderId}.`, error);
        throw new Error('Failed to update order status.');
    }
}

export async function deductStockFromWebhook(orderId: number): Promise<void> {
    if (!isDbConfigured) {
        console.log(`[WEBHOOK-DB] Simulating stock deduction for order ${orderId}`);
        return;
    }
    try {
        const db = getDb();
        const orderRows = await db`SELECT items FROM orders WHERE id = ${orderId}`;

        if (orderRows.length > 0) {
            const items = orderRows[0].items as OrderData['items'];
            console.log(`[WEBHOOK-DB] Deducting stock for order ${orderId}. Items:`, items);

            for (const item of items) {
                const quantityToDeduct = Number(item.quantity);
                if (isNaN(quantityToDeduct) || quantityToDeduct <= 0) {
                    console.warn(`[WEBHOOK-DB] Invalid quantity for item ${item.product.id} in order ${orderId}. Skipping stock deduction.`);
                    continue;
                }

                const result = await db`
                    UPDATE products SET stock = stock - ${quantityToDeduct}
                    WHERE id = ${item.product.id} AND stock >= ${quantityToDeduct}
                `;
                
                // FIX: Cast 'result' to 'any' to bypass the TS error, as '.count' exists at runtime.
                if ((result as any).count === 0) {
                     console.warn(`[WEBHOOK-DB] Could not deduct stock for product ${item.product.id}. Either out of stock or product not found.`);
                }
            }
            console.log(`[WEBHOOK-DB] Stock deduction process completed for order ${orderId}`);
        } else {
            console.warn(`[WEBHOOK-DB] Order ${orderId} not found for stock deduction.`);
        }
    } catch (error) {
        console.error(`[WEBHOOK-DB] CRITICAL: Failed to deduct stock for order ${orderId}.`, error);
        throw new Error('Failed to deduct stock.');
    }
}
