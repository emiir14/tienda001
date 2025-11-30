'use server';

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOrderById, updateOrderStatus, deductStockForOrder } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';

const orderStatusSchema = z.enum([
    'pending_payment',
    'awaiting_payment_in_store',
    'paid',
    'failed',
    'cancelled',
    'shipped',
    'delivered',
    'refunded'
]);

export async function updateOrderStatusAction(orderId: number, newStatus: OrderStatus) {
    const validatedStatus = orderStatusSchema.safeParse(newStatus);
    if (!validatedStatus.success) {
        return { error: 'Estado de orden inválido.' };
    }

    try {
        const currentOrder = await getOrderById(orderId);
        if (!currentOrder) {
            return { error: 'Orden no encontrada.' };
        }

        const currentStatus = currentOrder.status;
        const deliveryMethod = currentOrder.deliveryMethod;

        // --- NUEVAS REGLAS DE VALIDACIÓN ---

        // Regla 1: Prevenir que una orden de pago web (shipping) sea marcada como pago en local.
        if (deliveryMethod === 'shipping' && newStatus === 'awaiting_payment_in_store') {
            return { error: 'Una orden con envío no puede ser cambiada a \"Esperando Pago en Local\".' };
        }

        // Regla 2: Prevenir que una orden de pago local (pickup) sea marcada manually como pagada.
        if (deliveryMethod === 'pickup' && newStatus === 'paid') {
            return { error: 'Una orden de retiro en local debe ser marcada como \"Entregado\", no como \"Pagado\".' };
        }

        // --- LÓGICA DE DESCUENTO DE STOCK ACTUALIZADA ---

        // Ahora, el descuento de stock solo ocurre si TODAS las condiciones se cumplen:
        // 1. El estado anterior es 'awaiting_payment_in_store'.
        // 2. El nuevo estado es 'delivered'.
        // 3. El método de la orden es 'pickup' o 'pay_in_store'.
        if (currentStatus === 'awaiting_payment_in_store' && newStatus === 'delivered' && (deliveryMethod === 'pickup' || deliveryMethod === 'pay_in_store')) {
            console.log(`Order ${orderId} (local pickup or pay in store) is being delivered. Deducting stock.`);
            await deductStockForOrder(orderId);
        }

        // Actualizar el estado de la orden
        await updateOrderStatus(orderId, newStatus);

        revalidatePath('/admin');
        revalidatePath(`/admin/orders/${orderId}`);
        
        return { message: 'El estado de la orden fue actualizado exitosamente.' };

    } catch (e: any) {
        console.error('Action Error:', e);
        return { error: e.message || 'No se pudo actualizar el estado de la orden.' };
    }
}
