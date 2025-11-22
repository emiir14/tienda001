'use server';

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOrderById, updateOrderStatus, deductStockForOrder } from '@/lib/data'; // Importar funciones necesarias
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
    // 1. Validar el nuevo estado
    const validatedStatus = orderStatusSchema.safeParse(newStatus);
    if (!validatedStatus.success) {
        console.error('Validation Error:', validatedStatus.error);
        return { error: 'Estado de orden inválido.' };
    }

    try {
        // 2. Obtener el estado actual de la orden
        const currentOrder = await getOrderById(orderId);
        if (!currentOrder) {
            return { error: 'Orden no encontrada.' };
        }

        const currentStatus = currentOrder.status;

        // 3. Lógica condicional para descontar stock
        // Si la orden pasa de 'Esperando Pago en Local' a 'Entregado',
        // descontamos el stock.
        if (currentStatus === 'awaiting_payment_in_store' && newStatus === 'delivered') {
            console.log(`Order ${orderId} is being marked as delivered from awaiting_payment_in_store. Deducting stock.`);
            await deductStockForOrder(orderId);
            // Las métricas se actualizarán automáticamente porque 'delivered' está incluido en getSalesMetrics
        }

        // 4. Actualizar el estado de la orden (lógica original)
        await updateOrderStatus(orderId, newStatus);

        // 5. Revalidar paths para refrescar la UI
        revalidatePath('/admin');
        revalidatePath(`/admin/orders/${orderId}`);
        
        return { message: 'El estado de la orden fue actualizado exitosamente.' };

    } catch (e: any) {
        console.error('Action Error:', e);
        return { error: e.message || 'No se pudo actualizar el estado de la orden.' };
    }
}
