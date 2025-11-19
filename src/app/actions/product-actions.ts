"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import DOMPurify from 'isomorphic-dompurify';
import { createProduct, updateProduct, deleteProduct, getProductById } from '@/lib/data/products';
import { getCategories } from '@/lib/data';

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

const productSchema = z.object({
    id: z.coerce.number().optional(),
    name: z.string().min(1, "El nombre es requerido."),
    sku: z.string().optional().nullable(),
    description: z.string().min(1, "La descripción es requerida."),
    shortDescription: z.string().optional(),
    price: z.coerce.number({ required_error: "El precio es requerido."}).positive("El precio debe ser un número positivo."),
    featured: z.boolean().default(false),
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
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        const errorMessages = Object.entries(fieldErrors).map(([field, messages]) => `${field}: ${messages.join(', ')}`).join(' | ');
        return {
            error: `Error de validación. Detalles: ${errorMessages}`,
            fieldErrors: fieldErrors,
        };
    }

    const productData = validatedFields.data;

    try {
        await createProduct(productData as any);
        revalidatePath("/admin");
        revalidatePath("/tienda");
        revalidatePath("/");
        return { message: "Producto añadido exitosamente." };
    } catch (e: any) {
        return { error: e.message || "No se pudo añadir el producto." };
    }
}

export async function updateProductAction(id: number, formData: FormData) {
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
        return { error: "Producto no encontrado." };
    }

    const rawData = Object.fromEntries(formData.entries());
    const processedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawData)) {
        const cleanKey = key.startsWith(`${id}_`) ? key.substring(String(id).length + 1) : key;
        processedData[cleanKey] = value;
    }
    
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
    
    const categoryIds = formData.getAll(`${id}_categoryIds`).length > 0 
        ? formData.getAll(`${id}_categoryIds`).map(catId => Number(catId))
        : formData.getAll('categoryIds').map(catId => Number(catId));

    const validatedFields = productSchema.safeParse({
        ...existingProduct, // Start with existing data
        ...sanitizedData,   // Override with form data
        id,
        featured: sanitizedData.featured === 'on', // Explicitly handle checkbox
        images,
        categoryIds,
    });

    if (!validatedFields.success) {
        return {
            error: "Datos inválidos. Por favor, revisa los campos.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { ...productData } = validatedFields.data;

    try {
        await updateProduct(id, productData as any);
        revalidatePath("/admin");
        revalidatePath(`/products/${id}`);
        revalidatePath("/tienda");
        revalidatePath("/");
        return { message: "Producto actualizado exitosamente." };
    } catch (e: any) {
        return { error: e.message || "No se pudo actualizar el producto." };
    }
}


export async function deleteProductAction(id: number) {
    try {
        await deleteProduct(id);
        revalidatePath('/admin');
        revalidatePath("/tienda");
        revalidatePath("/");
        return { message: 'Producto eliminado exitosamente.' }
    } catch (e: any) {
        return { error: e.message || 'No se pudo eliminar el producto.' }
    }
}

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
                const wrappedData = `[${data}]`;
                productList = JSON.parse(wrappedData);
            }
        } catch (e) {
            try {
                const wrappedData = `[${data}]`;
                productList = JSON.parse(wrappedData);
            } catch (e2) {
                 return { createdCount: 0, updatedCount: 0, errors: [{ row: 0, message: "Error al parsear el archivo JSON. Asegúrate que sea un formato válido." }] };
            }
        }

        if (productList.length > 0 && productList[0].categories && Array.isArray(productList[0].categories)) {
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
        'SKU': 'sku',
        'sku': 'sku',
        'Short Description': 'shortDescription',
        'Price': 'price',
        'price': 'price',
        'Stock': 'stock',
        'stock': 'stock',
        'Categories': 'categories',
        'categoryName': 'categories',
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
        'featured': 'featured',
        'Featured': 'featured'
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
            if(typeof rowData.price === 'string') {
                rowData.price = rowData.price.replace(/[^0-9.,]/g, '').replace(',', '.');
            }
            
            const categoryNames = (rowData.categories || '').split(';').map((c: string) => c.trim().toLowerCase());
            const categoryIds = categoryNames
                .map((name: string) => categoryMap.get(name))
                .filter((id: number | undefined): id is number => id !== undefined);

            if (categoryIds.length === 0 && rowData.categories) {
                 throw new Error(`Categoría no encontrada: ${rowData.categories}. Por favor, créala primero.`);
            }

            const images = [rowData.image1, rowData.image2, rowData.image3, rowData.image4, rowData.image5].filter(Boolean);
            if (images.length === 0) {
                throw new Error('Al menos una URL de imagen es requerida.');
            }
            
            const featuredValue = ['true', 'yes', '1'].includes(String(rowData.featured).toLowerCase());

            const productToValidate = {
                id: rowData.id,
                name: rowData.name,
                sku: rowData.sku,
                description: rowData.description || rowData.name,
                shortDescription: rowData.shortDescription,
                price: rowData.price,
                featured: featuredValue,
                stock: rowData.stock ?? 1,
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
                    await updateProduct(id, productData as any);
                    updatedCount++;
                } else {
                    await createProduct({ ...productData, id } as any);
                    createdCount++;
                }
            } else {
                await createProduct(productData as any);
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
