"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateOrderStatus } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';

// --- CORRECCIÓN ---
// Se actualiza el esquema para que coincida con los estados de OrderStatus en types.ts
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
    
    // La validación ahora funcionará correctamente
    if (!validatedStatus.success) {
        console.error('Validation Error:', validatedStatus.error); // Log para debugging
        return { error: 'Estado de orden inválido.' };
    }

    try {
        await updateOrderStatus(orderId, validatedStatus.data);
        revalidatePath('/admin');
        revalidatePath(`/admin/orders/${orderId}`); // Revalidar también la página de la orden
        return { message: 'El estado de la orden fue actualizado exitosamente.' };
    } catch (e: any) {
        console.error('Action Error:', e); // Log para debugging
        return { error: e.message || 'No se pudo actualizar el estado de la orden.' };
    }
}
