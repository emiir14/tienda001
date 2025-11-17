"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCategory, deleteCategory, updateCategory } from '@/lib/data';

const categorySchema = z.object({
    name: z.string().min(2, "El nombre de la categoría es requerido."),
    parentId: z.coerce.number().optional().nullable(),
});


export async function addCategoryAction(formData: FormData) {
    const name = formData.get('name') as string;
    const parentId = formData.get('parentId');

    const validatedFields = categorySchema.safeParse({
        name,
        parentId: parentId ? Number(parentId) : null,
    });

    if (!validatedFields.success) {
        return {
            error: "Nombre de categoría inválido.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    try {
        await createCategory(validatedFields.data.name, validatedFields.data.parentId);
        revalidatePath("/admin");
        revalidatePath("/tienda");
        return { message: "Categoría creada exitosamente." };
    } catch (e: any) {
        return { error: e.message || "No se pudo crear la categoría." };
    }
}


export async function updateCategoryAction(id: number, formData: FormData) {
    const name = formData.get('name') as string;

    const validatedFields = categorySchema.pick({ name: true }).safeParse({ name });

    if (!validatedFields.success) {
        return {
            error: "Nombre de categoría inválido.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        await updateCategory(id, validatedFields.data.name);
        revalidatePath("/admin");
        revalidatePath("/tienda");
        return { message: "Categoría actualizada exitosamente." };
    } catch (e: any) {
        return { error: e.message || "No se pudo actualizar la categoría." };
    }
}


export async function deleteCategoryAction(id: number) {
    try {
        const result = await deleteCategory(id);
        if (!result.success) {
            return { error: result.message };
        }
        revalidatePath('/admin');
        return { message: 'Categoría eliminada exitosamente.' }
    } catch (e: any) {
        return { error: e.message || 'No se pudo eliminar la categoría.' }
    }
}
