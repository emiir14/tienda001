"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateOrderStatus } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';

const orderStatusSchema = z.enum(['pending', 'paid', 'failed', 'cancelled', 'shipped', 'delivered', 'refunded']);

export async function updateOrderStatusAction(orderId: number, newStatus: OrderStatus) {
    const validatedStatus = orderStatusSchema.safeParse(newStatus);
    if (!validatedStatus.success) {
        return { error: 'Estado de orden inválido.' };
    }

    try {
        await updateOrderStatus(orderId, validatedStatus.data);
        revalidatePath('/admin');
        return { message: 'El estado de la orden fue actualizado exitosamente.' };
    } catch (e: any) {
        return { error: e.message || 'No se pudo actualizar el estado de la orden.' };
    }
}
