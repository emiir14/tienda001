"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import DOMPurify from 'isomorphic-dompurify';
import { createCoupon, updateCoupon, deleteCoupon } from '@/lib/data';

// Helper to sanitize form data
function sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitizedData: Record<string, any> = {};
    for (const key in data) {
        if (typeof data[key] === 'string') {
            sanitizedData[key] = DOMPurify.sanitize(data[key]);
        } else {
            sanitizedData[key] = data[key];
        }
    }
    return sanitizedData;
}

const couponSchema = z.object({
    code: z.string().min(3, "El código debe tener al menos 3 caracteres.").max(50, "El código no puede tener más de 50 caracteres."),
    discountType: z.enum(['percentage', 'fixed'], { required_error: "El tipo de descuento es requerido."}),
    discountValue: z.coerce.number({ required_error: "El valor es requerido." }).positive("El valor del descuento debe ser un número positivo."),
    minPurchaseAmount: z.coerce.number().positive("El monto de compra mínima debe ser positivo.").optional().nullable(),
    expiryDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
    isActive: z.boolean(),
}).refine(data => {
    if (data.discountType === 'percentage') {
        return data.discountValue <= 100;
    }
    return true;
}, {
    message: "El porcentaje de descuento no puede ser mayor a 100.",
    path: ["discountValue"],
});


export async function addCouponAction(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const sanitizedData = sanitizeData(rawData);

    if (sanitizedData.expiryDate === '') sanitizedData.expiryDate = null;
    if (sanitizedData.minPurchaseAmount === '') sanitizedData.minPurchaseAmount = null;
    
    const validatedFields = couponSchema.safeParse({
        ...sanitizedData,
        isActive: sanitizedData.isActive === 'on',
    });

    if (!validatedFields.success) {
        return {
            error: "Datos de cupón inválidos. Por favor, revisa los campos.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        await createCoupon(validatedFields.data);
        revalidatePath("/admin");
        return { message: "Cupón creado exitosamente." };
    } catch (e: any) {
        if (e.message.includes('ya existe')) {
            return { error: `El código de cupón '${validatedFields.data.code}' ya existe.` };
        }
        return { error: e.message || "No se pudo crear el cupón." };
    }
}

export async function updateCouponAction(id: number, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const sanitizedData = sanitizeData(rawData);
    
    if (sanitizedData.expiryDate === '') sanitizedData.expiryDate = null;
    if (sanitizedData.minPurchaseAmount === '') sanitizedData.minPurchaseAmount = null;

    const validatedFields = couponSchema.safeParse({
        ...sanitizedData,
        isActive: sanitizedData.isActive === 'on',
    });

    if (!validatedFields.success) {
        return {
            error: "Datos de cupón inválidos. Por favor, revisa los campos.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        await updateCoupon(id, validatedFields.data);
        revalidatePath("/admin");
        return { message: "Cupón actualizado exitosamente." };
    } catch (e: any) {
        if (e.message.includes('ya existe')) {
            return { error: `El código de cupón '${validatedFields.data.code}' ya existe.` };
        }
        return { error: e.message || "No se pudo actualizar el cupón." };
    }
}

export async function deleteCouponAction(id: number) {
    try {
        await deleteCoupon(id);
        revalidatePath('/admin');
        return { message: 'Cupón eliminado exitosamente.' }
    } catch (e: any) {
        return { error: e.message || 'No se pudo eliminar el cupón.' }
    }
}
