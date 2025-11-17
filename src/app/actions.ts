
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import DOMPurify from 'isomorphic-dompurify';
import { addSubscriber } from "@/lib/subscribers";
import { createProduct, updateProduct, deleteProduct, getProductById, getProducts } from '@/lib/data/products';
import { createCoupon, updateCoupon, deleteCoupon, createCategory, deleteCategory, updateCategory, updateOrderStatus, getCategories } from '@/lib/data';
import type { Product, Coupon, OrderStatus } from '@/lib/types';

// Helper function to sanitize form data
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


const productSchema = z.object({
    id: z.coerce.number().optional(), // ID es opcional aquí
    name: z.string().min(1, "El nombre es requerido."),
    description: z.string().min(1, "La descripción es requerida."),
    shortDescription: z.string().optional(),
    price: z.coerce.number({ required_error: "El precio es requerido."}).positive("El precio debe ser un número positivo."),
    discountPercentage: z.coerce.number().min(0, "El descuento no puede ser negativo.").max(100, "El descuento no puede ser mayor a 100.").optional().nullable(),
    offerStartDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
    offerEndDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
    stock: z.coerce.number({ required_error: "El stock es requerido."}).int("El stock debe ser un número entero.").min(0, "El stock no puede ser negativo."),
    categoryIds: z.array(z.coerce.number()).min(1, "Se requiere al menos una categoría."),
    images: z.array(z.string().url("La URL de la imagen no es válida.")).min(1, "Se requiere al menos una imagen."),
    aiHint: z.string().optional(),
});

const createProductSchema = productSchema.omit({ id: true });



export async function addProductAction(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const sanitizedData = sanitizeData(rawData);

    if (sanitizedData.discountPercentage === '') sanitizedData.discountPercentage = null;
    if (sanitizedData.offerStartDate === '') sanitizedData.offerStartDate = null;
    if (sanitizedData.offerEndDate === '') sanitizedData.offerEndDate = null;
    
    const images = [];
    for (let i = 1; i <= 5; i++) {
        if (sanitizedData[`image${i}`]) {
            images.push(sanitizedData[`image${i}`]);
        }
    }
    const categoryIds = formData.getAll('categoryIds').map(id => Number(id));

    const validatedFields = createProductSchema.safeParse({
      ...sanitizedData,
      featured: sanitizedData.featured === 'on',
      images,
      categoryIds,
    });

    if (!validatedFields.success) {
        console.error("Validation failed", validatedFields.error.flatten().fieldErrors);
        // Crea un mensaje de error detallado para mostrar en el panel
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        const errorMessages = Object.entries(fieldErrors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join(' | ');

        return {
            error: `Error de validación. Detalles: ${errorMessages}`,
            fieldErrors: fieldErrors,
        };
    }

    // @ts-ignore - featured is not in the schema anymore, but we don't want to break if it's passed
    const { id, featured, ...productData } = validatedFields.data;

    try {
        await createProduct(productData);
        revalidatePath("/admin");
        revalidatePath("/tienda");
        revalidatePath("/");
        return { message: "Producto añadido exitosamente." };
    } catch (e: any) {
        console.error(e);
        return { error: e.message || "No se pudo añadir el producto." };
    }
}

export async function updateProductAction(id: number, formData: FormData) {
    console.log(`[Action] Starting update for product ID: ${id}`);
    const rawData = Object.fromEntries(formData.entries());
    console.log(`[Action] Raw form data:`, rawData);
    
    // Handle the "1_" prefixed form fields
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(rawData)) {
        // Remove the "1_" prefix if it exists
        const cleanKey = key.startsWith('1_') ? key.substring(2) : key;
        processedData[cleanKey] = value;
    }
    
    console.log(`[Action] Processed data:`, processedData);
    
    const sanitizedData = sanitizeData(processedData);

    if (sanitizedData.discountPercentage === '') sanitizedData.discountPercentage = null;
    if (sanitizedData.offerStartDate === '') sanitizedData.offerStartDate = null;
    if (sanitizedData.offerEndDate === '') sanitizedData.offerEndDate = null;

    const images = [];
    for (let i = 1; i <= 5; i++) {
        if (sanitizedData[`image${i}`]) {
            images.push(sanitizedData[`image${i}`]);
        }
    }
    
    // Handle categoryIds - they might come as "1_categoryIds" multiple times
    const categoryIds = formData.getAll('1_categoryIds').length > 0 
        ? formData.getAll('1_categoryIds').map(id => Number(id))
        : formData.getAll('categoryIds').map(id => Number(id));

    console.log(`[Action] Extracted categoryIds:`, categoryIds);
    console.log(`[Action] Extracted images:`, images);

    const validatedFields = productSchema.safeParse({
        ...sanitizedData,
        id, // Add id for validation
        images,
        categoryIds,
    });

    if (!validatedFields.success) {
        console.error("[Action] Validation failed for updateProductAction:", validatedFields.error.flatten().fieldErrors);
        return {
            error: "Datos inválidos. Por favor, revisa los campos.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    console.log("[Action] Data validated successfully. Attempting to update product in DB.");
    console.log("[Action] Payload:", JSON.stringify(validatedFields.data, null, 2));
    
    // @ts-ignore - featured is not in the schema anymore
    const { featured, ...productData } = validatedFields.data;

    try {
        await updateProduct(id, productData);
        console.log(`[Action] Successfully updated product ID: ${id}. Revalidating paths.`);
        revalidatePath("/admin");
        revalidatePath(`/products/${id}`);
        revalidatePath("/tienda");
        revalidatePath("/");
        return { message: "Producto actualizado exitosamente." };
    } catch (e: any) {
        console.error(`[Action] CRITICAL: Failed to update product ID ${id}. Error:`, e.message);
        return { error: e.message || "No se pudo actualizar el producto." };
    }
}


export async function deleteProductAction(id: number) {
    console.log(`[Action] Starting delete for product ID: ${id}`);
    try {
        await deleteProduct(id);
        console.log(`[Action] Successfully deleted product ID: ${id}. Revalidating paths.`);
        revalidatePath('/admin');
        revalidatePath("/tienda");
        revalidatePath("/");
        return { message: 'Producto eliminado exitosamente.' }
    } catch (e: any) {
        console.error(`[Action] CRITICAL: Failed to delete product ID ${id}. Error:`, e.message);
        return { error: e.message || 'No se pudo eliminar el producto.' }
    }
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
        console.error("Validation failed", validatedFields.error.flatten().fieldErrors);
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
        console.error(e);
        if (e.message.includes('UNIQUE constraint failed') || e.message.includes('ER_DUP_ENTRY') || e.message.includes('ya existe')) {
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
        console.error("Validation failed", validatedFields.error.flatten().fieldErrors);
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
        console.error(e);
        if (e.message.includes('UNIQUE constraint failed') || e.message.includes('ER_DUP_ENTRY') || e.message.includes('ya existe')) {
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
        console.error(e);
        return { error: e.message || 'No se pudo eliminar el cupón.' }
    }
}


const subscriberSchema = z.object({
  email: z.string().email("El email no es válido."),
});

export async function addSubscriberAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const sanitizedData = sanitizeData(rawData);

  const validatedFields = subscriberSchema.safeParse(sanitizedData);

  if (!validatedFields.success) {
    return {
      error: "Email inválido. Por favor, ingrese un email correcto.",
    };
  }

  try {
    await addSubscriber(validatedFields.data.email);
    return { message: "¡Gracias por suscribirte!" };
  } catch (e: any) {
    if (e.message.includes('UNIQUE constraint failed') || e.message.includes('ER_DUP_ENTRY') || e.message.includes('ya está suscripto')) {
      return { error: "Este email ya está suscripto." };
    }
    return { error: e.message || "No se pudo procesar la suscripción." };
  }
}

// Category Actions

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

// Order Actions
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

// Import Products Action
export async function importProductsAction(data: string, format: 'csv' | 'json') {
    const allCategories = await getCategories();
    const categoryMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c.id]));

    let productList: Record<string, any>[] = [];

    if (format === 'csv') {
        const lines = data.trim().split('\n');
        const header = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1);
        
        productList = rows.map(row => {
            const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
            const rowData: Record<string, any> = {};
            header.forEach((key, j) => {
                rowData[key] = values[j] || undefined;
            });
            return rowData;
        });
    } else if (format === 'json') {
        try {
            productList = JSON.parse(data);
            if (!Array.isArray(productList)) {
                 // Try to wrap it in an array and parse again for single objects or comma-separated objects
                const wrappedData = `[${data}]`;
                productList = JSON.parse(wrappedData);
            }
        } catch (e) {
            try {
                // If parsing fails, try to wrap it in an array and parse again
                const wrappedData = `[${data}]`;
                productList = JSON.parse(wrappedData);
            } catch (e2) {
                 return { createdCount: 0, updatedCount: 0, errors: [{ row: 0, message: "Error al parsear el archivo JSON. Asegúrate que sea un formato válido." }] };
            }
        }

        // After parsing, check for nested structures.
        if (productList.length > 0 && productList[0].categories && Array.isArray(productList[0].categories)) {
            // Handle the nested structure from the example
             productList = productList.flatMap((item: any) => 
                item.categories.flatMap((cat: any) => 
                    cat.products?.map((p: any) => ({ ...p, categoryName: cat.name })) || []
                )
             );
        } else if (!Array.isArray(productList)) {
             return { createdCount: 0, updatedCount: 0, errors: [{ row: 0, message: "Formato JSON no soportado." }] };
        }
    }


    let createdCount = 0;
    let updatedCount = 0;
    const errors: { row: number; message: string }[] = [];

    const fieldMap: Record<string, string> = {
        'ID': 'id',
        'Name': 'name',
        'name': 'name',
        'Short Description': 'shortDescription',
        'Price': 'price',
        'price': 'price',
        'Stock': 'stock',
        'stock': 'stock',
        'Categories': 'categories', // Raw categories string from CSV
        'categoryName': 'categories', // From the example JSON structure
        'Category': 'categories',
        'category': 'categories',
        'Image URL 1': 'image1', 'image_url': 'image1',
        'Image URL 2': 'image2',
        'Image URL 3': 'image3',
        'Image URL 4': 'image4',
        'Image URL 5': 'image5',
        'AI Hint': 'aiHint',
        'aiHint': 'aiHint',
        'Discount Percentage': 'discountPercentage',
        'Offer Start Date': 'offerStartDate',
        'Offer End Date': 'offerEndDate',
        'description': 'description',
    };
    
    for (let i = 0; i < productList.length; i++) {
        const rawRow = productList[i];
        if (!rawRow) continue;

        const rowData: Record<string, any> = {};
        for(const key in rawRow) {
            const mappedKey = fieldMap[key] || key;
            rowData[mappedKey] = rawRow[key];
        }

        try {
            // Clean up price string
            if(typeof rowData.price === 'string') {
                rowData.price = rowData.price.replace(/[^0-9.,]/g, '').replace(',', '.');
            }

            // Map category names to IDs, case-insensitively
            const categoryNames = (rowData.categories || '').split(';').map((c: string) => c.trim().toLowerCase());
            const categoryIds = categoryNames
                .map((name: string) => categoryMap.get(name))
                .filter((id: number | undefined): id is number => id !== undefined);

            if (categoryIds.length === 0 && rowData.categories) {
                 console.warn(`No valid categories found for names: ${rowData.categories}. Check spelling and if they exist.`);
                 throw new Error(`Categoría no encontrada: ${rowData.categories}. Por favor, créala primero.`);
            }

            const images = [rowData.image1, rowData.image2, rowData.image3, rowData.image4, rowData.image5].filter(Boolean);
            if (images.length === 0) {
                throw new Error('Al menos una URL de imagen es requerida.');
            }

            const productToValidate = {
                id: rowData.id,
                name: rowData.name,
                description: rowData.description || rowData.name,
                shortDescription: rowData.shortDescription,
                price: rowData.price,
                stock: rowData.stock ?? 1, // Default stock to 1 if not provided
                images,
                categoryIds,
                aiHint: rowData.aiHint,
                discountPercentage: rowData.discountPercentage || null,
                offerStartDate: rowData.offerStartDate || null,
                offerEndDate: rowData.offerEndDate || null,
            };

            const validatedFields = productSchema.safeParse(productToValidate);

            if (!validatedFields.success) {
                const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join('; ');
                throw new Error(errorMessages || "Error de validación desconocido.");
            }

            const { id, ...productData } = validatedFields.data;

            if (id) {
                const existingProduct = await getProductById(id);
                if (existingProduct) {
                    await updateProduct(id, productData);
                    updatedCount++;
                } else {
                    await createProduct({ ...productData, id });
                    createdCount++;
                }
            } else {
                await createProduct(productData);
                createdCount++;
            }
        } catch (e: any) {
            errors.push({ row: i + (format === 'csv' ? 2 : 1), message: e.message || "Error desconocido." });
        }
    }

    revalidatePath("/admin");
    revalidatePath("/tienda");
    revalidatePath("/");

    return { createdCount, updatedCount, errors };
}
