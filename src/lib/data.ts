
'use server';

import { getDb, isDbConfigured } from './db';
import {
    getProducts as getProductsFromHardcodedData,
    getProductById as getProductByIdFromHardcodedData,
    createProduct as createProductFromHardcodedData,
    updateProduct as updateProductFromHardcodedData,
    deleteProduct as deleteProductFromHardcodedData,
    getCategories as getCategoriesFromHardcodedData,
    createCategory as createCategoryFromHardcodedData,
    deleteCategory as deleteCategoryFromHardcodedData,
    getCoupons as getCouponsFromHardcodedData,
    getCouponById as getCouponByIdFromHardcodedData,
    getCouponByCode as getCouponByCodeFromHardcodedData,
    createCoupon as createCouponFromHardcodedData,
    updateCoupon as updateCouponFromHardcodedData,
    deleteCoupon as deleteCouponFromHardcodedData,
    getSalesMetrics as getSalesMetricsFromHardcodedData,
    createOrder as createOrderFromHardcodedData,
    updateOrderStatus as updateOrderStatusFromHardcodedData,
    getOrders as getOrdersFromHardcodedData,
    getOrderById as getOrderByIdFromHardcodedData,
    createOrderFromWebhook as createOrderFromWebhookFromHardcodedData,
} from './hardcoded-data';
import type { Product, Coupon, SalesMetrics, OrderData, OrderStatus, Order, Category } from './types';
import { unstable_noStore as noStore } from 'next/cache';

function mapProductFromDb(product: any): Product {
    return {
        id: product.id,
        name: product.name,
        description: product.description,
        shortDescription: product.short_description,
        price: parseFloat(product.price),
        salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
        images: product.images,
        stock: product.stock,
        categoryIds: [], 
        aiHint: product.ai_hint,
        featured: product.featured,
        discountPercentage: product.discount_percentage,
        offerStartDate: product.offer_start_date ? new Date(product.offer_start_date) : null,
        offerEndDate: product.offer_end_date ? new Date(product.offer_end_date) : null,
        createdAt: new Date(product.created_at),
    };
}

function _calculateSalePrice(product: Omit<Product, 'salePrice' | 'id'>): number | null {
    const now = new Date();
    const isOfferValid = 
        product.discountPercentage && product.discountPercentage > 0 &&
        product.offerStartDate && product.offerEndDate &&
        now >= new Date(product.offerStartDate) && now <= new Date(product.offerEndDate);

    if (isOfferValid) {
        const discount = product.price * (product.discountPercentage! / 100);
        return parseFloat((product.price - discount).toFixed(2));
    }
    return null;
}

function _mapDbRowToProduct(row: any): Product {
    const product: Product = {
        id: row.id,
        name: row.name,
        description: row.description,
        shortDescription: row.short_description,
        price: parseFloat(row.price),
        images: row.images,
        categoryIds: row.category_ids || [],
        stock: row.stock,
        aiHint: row.ai_hint,
        featured: row.featured,
        discountPercentage: row.discount_percentage ? parseFloat(row.discount_percentage) : null,
        offerStartDate: row.offer_start_date,
        offerEndDate: row.offer_end_date,
        salePrice: null,
    };
    product.salePrice = _calculateSalePrice(product);
    return product;
}

export async function getProducts(): Promise<Product[]> {
    if (!isDbConfigured) return getProductsFromHardcodedData();
    noStore();
    try {
        const db = getDb();
        const rows = await db`
            SELECT p.*, COALESCE(array_agg(pc.category_id) FILTER (WHERE pc.category_id IS NOT NULL), '{}') as category_ids
            FROM products p
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            GROUP BY p.id
            ORDER BY p.created_at DESC;
        `;
        return rows.map(_mapDbRowToProduct);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch products.');
    }
}

export async function getProductById(id: number): Promise<Product | undefined> {
    if (!isDbConfigured) return getProductByIdFromHardcodedData(id);
    noStore();
    try {
         const db = getDb();
         const rows = await db`
            SELECT p.*, COALESCE(array_agg(pc.category_id) FILTER (WHERE pc.category_id IS NOT NULL), '{}') as category_ids
            FROM products p
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            WHERE p.id = ${id}
            GROUP BY p.id;
        `;
        if (rows.length === 0) return undefined;
        return _mapDbRowToProduct(rows[0]);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch product.');
    }
}

export async function createProduct(productData: any): Promise<Product> {
    if (!isDbConfigured) return createProductFromHardcodedData(productData);
    const { categoryIds, ...newProductData } = productData;
    try {
        const db = getDb();
        const productResult = await db`
            INSERT INTO products (
                name, description, short_description, price, images, stock,
                ai_hint, featured, discount_percentage, offer_start_date, offer_end_date
            ) VALUES (
                ${newProductData.name}, ${newProductData.description}, ${newProductData.shortDescription}, 
                ${newProductData.price}, ${newProductData.images}, ${newProductData.stock},
                ${newProductData.aiHint}, ${newProductData.featured || false}, ${newProductData.discountPercentage}, 
                ${newProductData.offerStartDate}, ${newProductData.offerEndDate}
            )
            RETURNING *;
        `;
        const createdProductRow = productResult[0];
        if (!createdProductRow || !createdProductRow.id) {
            throw new Error("Falló la creación del producto en la base de datos, no se pudo obtener el ID.");
        }
        if (categoryIds && categoryIds.length > 0) {
            await db`
                INSERT INTO product_categories (product_id, category_id)
                SELECT * FROM UNNEST(
                    ${Array(categoryIds.length).fill(createdProductRow.id)}::int[],
                    ${categoryIds}::int[]
                )
            `;
        }
        const mappedProduct = mapProductFromDb(createdProductRow);
        mappedProduct.categoryIds = categoryIds || [];
        return mappedProduct;
    } catch (error) {
        console.error('Database Error (Neon/direct): Failed to create product.', error);
        throw new Error('Failed to create product.');
    }
}

export async function updateProduct(id: number, productData: Partial<Omit<Product, 'id' | 'salePrice'>>): Promise<Product> {
    if (!isDbConfigured) return updateProductFromHardcodedData(id, productData);
    const { name, description, shortDescription, price, images, categoryIds, stock, aiHint, featured, discountPercentage, offerStartDate, offerEndDate } = productData;
    try {
        const db = getDb();
        await db`
            UPDATE products
            SET name = COALESCE(${name}, name), 
                description = COALESCE(${description}, description), 
                short_description = COALESCE(${shortDescription}, short_description), 
                price = COALESCE(${price}, price), 
                images = COALESCE(${images}, images), 
                stock = COALESCE(${stock}, stock), 
                ai_hint = COALESCE(${aiHint}, ai_hint), 
                featured = COALESCE(${featured}, featured), 
                discount_percentage = ${discountPercentage}, 
                offer_start_date = ${offerStartDate?.toISOString() || null}, 
                offer_end_date = ${offerEndDate?.toISOString() || null}
            WHERE id = ${id}
        `;
        if (categoryIds !== undefined) {
            await db`DELETE FROM product_categories WHERE product_id = ${id}`;
            if (categoryIds && categoryIds.length > 0) {
                for (const catId of categoryIds) {
                    await db`INSERT INTO product_categories (product_id, category_id) VALUES (${id}, ${catId}) ON CONFLICT DO NOTHING`;
                }
            }
        }
        const finalProduct = await getProductById(id);
        if (!finalProduct) throw new Error('Product not found after update');
        return finalProduct;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update product.');
    }
}

export async function deleteProduct(id: number): Promise<void> {
    if (!isDbConfigured) return deleteProductFromHardcodedData(id);
    try {
        const db = getDb();
        await db`DELETE FROM product_categories WHERE product_id = ${id}`;
        await db`DELETE FROM products WHERE id = ${id}`;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to delete product.');
    }
}

function _mapDbRowToCategory(row: any): Category {
    return { id: row.id, name: row.name, parentId: row.parent_id };
}

export async function getCategories(): Promise<Category[]> {
    if (!isDbConfigured) return getCategoriesFromHardcodedData();
    noStore();
    try {
        const db = getDb();
        const rows = await db`SELECT * FROM categories ORDER BY parent_id, name ASC`;
        return rows.map(_mapDbRowToCategory);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch categories.');
    }
}

export async function createCategory(name: string): Promise<Category> {
    if (!isDbConfigured) return createCategoryFromHardcodedData(name);
    try {
        const db = getDb();
        const result = await db`INSERT INTO categories (name) VALUES (${name}) RETURNING *;`;
        return _mapDbRowToCategory(result[0]);
    } catch (error: any) {
        if (error.message.includes('duplicate key value')) {
            throw new Error(`La categoría '${name}' ya existe.`);
        }
        console.error('Database Error:', error);
        throw new Error('Failed to create category.');
    }
}

export async function deleteCategory(id: number): Promise<{ success: boolean; message?: string }> {
    if (!isDbConfigured) return deleteCategoryFromHardcodedData(id);
    try {
        const db = getDb();
        const products = await db`SELECT 1 FROM product_categories WHERE category_id = ${id} LIMIT 1`;
        if (products.length > 0) {
            return { success: false, message: 'Categoría asignada a productos.' };
        }
        await db`DELETE FROM categories WHERE id = ${id}`;
        return { success: true };
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to delete category.');
    }
}

function _mapDbRowToCoupon(row: any): Coupon {
    return {
        id: row.id,
        code: row.code,
        discountType: row.discount_type,
        discountValue: parseFloat(row.discount_value),
        expiryDate: row.expiry_date,
        isActive: row.is_active,
    };
}

export async function getCoupons(): Promise<Coupon[]> {
    if (!isDbConfigured) return getCouponsFromHardcodedData();
    noStore();
    try {
        const db = getDb();
        const rows = await db`SELECT * FROM coupons ORDER BY created_at DESC`;
        return rows.map(_mapDbRowToCoupon);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch coupons.');
    }
}

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
    if (!isDbConfigured) return getCouponByCodeFromHardcodedData(code);
    noStore();
    try {
        const db = getDb();
        const rows = await db`
            SELECT * FROM coupons 
            WHERE code = ${code.toUpperCase()} AND is_active = TRUE AND (expiry_date IS NULL OR expiry_date > NOW())
        `;
        if (rows.length === 0) return undefined;
        return _mapDbRowToCoupon(rows[0]);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch coupon.');
    }
}

export async function createCoupon(coupon: Omit<Coupon, 'id'>): Promise<Coupon> {
    if (!isDbConfigured) return createCouponFromHardcodedData(coupon);
    const { code, discountType, discountValue, expiryDate, isActive } = coupon;
    try {
        const db = getDb();
        const result = await db`
            INSERT INTO coupons (code, discount_type, discount_value, expiry_date, is_active)
            VALUES (${code.toUpperCase()}, ${discountType}, ${discountValue}, ${expiryDate?.toISOString()}, ${isActive})
            RETURNING *;
        `;
        return _mapDbRowToCoupon(result[0]);
    } catch (error: any) {
        if (error.message.includes('duplicate key value')) {
            throw new Error(`El código de cupón '${coupon.code}' ya existe.`);
        }
        console.error('Database Error:', error);
        throw new Error('Failed to create coupon.');
    }
}

export async function updateCoupon(id: number, couponData: Partial<Omit<Coupon, 'id'>>): Promise<Coupon> {
    if (!isDbConfigured) return updateCouponFromHardcodedData(id, couponData);
    const { code, discountType, discountValue, expiryDate, isActive } = couponData;
    try {
        const db = getDb();
        const result = await db`
            UPDATE coupons
            SET code = COALESCE(${code?.toUpperCase()}, code), 
                discount_type = COALESCE(${discountType}, discount_type), 
                discount_value = COALESCE(${discountValue}, discount_value), 
                expiry_date = ${expiryDate?.toISOString() || null}, 
                is_active = COALESCE(${isActive}, is_active)
            WHERE id = ${id}
            RETURNING *;
        `;
        return _mapDbRowToCoupon(result[0]);
    } catch (error: any) {
        if (error.message.includes('duplicate key value')) {
             throw new Error(`El código de cupón '${couponData.code}' ya existe.`);
        }
        console.error('Database Error:', error);
        throw new Error('Failed to update coupon.');
    }
}

export async function deleteCoupon(id: number): Promise<void> {
    if (!isDbConfigured) return deleteCouponFromHardcodedData(id);
    try {
        const db = getDb();
        await db`DELETE FROM coupons WHERE id = ${id}`;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to delete coupon.');
    }
}

export async function createOrder(orderData: OrderData): Promise<{orderId?: number, error?: string}> {
    if (!isDbConfigured) return createOrderFromHardcodedData(orderData);
    try {
        const db = getDb();
        for (const item of orderData.items) {
            const productResult = await db`SELECT stock, name FROM products WHERE id = ${item.product.id}`;
            if (productResult.length === 0) return { error: `Producto no encontrado: ${item.product.id}` };
            if (productResult[0].stock < item.quantity) {
                return { error: `Stock insuficiente para \"${productResult[0].name}\".` };
            }
        }
        const { customerName, customerEmail, total, items, couponCode, discountAmount, shippingAddress, shippingCity, shippingPostalCode } = orderData;
        const orderResult = await db`
            INSERT INTO orders (customer_name, customer_email, total, status, items, coupon_code, discount_amount, shipping_address, shipping_city, shipping_postal_code, created_at)
            VALUES (${customerName}, ${customerEmail}, ${total}, 'pending', ${JSON.stringify(items)}::jsonb, ${couponCode}, ${discountAmount}, ${shippingAddress}, ${shippingCity}, ${shippingPostalCode}, ${new Date().toISOString()})
            RETURNING id;
        `;
        return { orderId: orderResult[0].id };
    } catch (error: any) {
        console.error('Database Error:', error);
        return { error: error.message || 'Failed to create order.' };
    }
}

export async function deductStockForOrder(orderId: number): Promise<void> {
    if (!isDbConfigured) return;
    try {
        const db = getDb();
        const orderRows = await db`SELECT items FROM orders WHERE id = ${orderId}`;
        if (orderRows.length > 0) {
            const items = orderRows[0].items as OrderData['items'];
            for (const item of items) {
                await db`
                    UPDATE products SET stock = stock - ${item.quantity} 
                    WHERE id = ${item.product.id} AND stock >= ${item.quantity}
                `;
            }
            console.log(`Stock deducted for order ${orderId}`);
        }
    } catch (error) {
        console.error(`CRITICAL: Failed to deduct stock for order ${orderId}.`, error);
        throw new Error('Failed to deduct stock.');
    }
}

export async function updateOrderStatus(orderId: number, status: OrderStatus, paymentId?: string | null): Promise<void> {
    if (!isDbConfigured) return updateOrderStatusFromHardcodedData(orderId, status, paymentId || undefined);
    try {
        const db = getDb();
        if (paymentId !== undefined) {
             await db`UPDATE orders SET status = ${status}, payment_id = COALESCE(${paymentId}, payment_id) WHERE id = ${orderId}`;
        } else {
             await db`UPDATE orders SET status = ${status} WHERE id = ${orderId}`;
        }
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update order status.');
    }
}

function mapOrderFromDb(row: any): Order {
    return {
        id: row.id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        total: parseFloat(row.total),
        status: row.status as OrderStatus,
        createdAt: new Date(row.created_at),
        items: row.items,
        couponCode: row.coupon_code,
        discountAmount: row.discount_amount ? parseFloat(row.discount_amount) : undefined,
        paymentId: row.payment_id || undefined,
        shippingAddress: row.shipping_address,
        shippingCity: row.shipping_city,
        shippingPostalCode: row.shipping_postal_code,
    };
}

export async function getOrderById(id: number): Promise<Order | undefined> {
    if (!isDbConfigured) return getOrderByIdFromHardcodedData(id);
    noStore();
    try {
        const db = getDb();
        const result = await db`SELECT * FROM orders WHERE id = ${id}`;
        if (result.length === 0) return undefined;
        return mapOrderFromDb(result[0]);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch order.');
    }
}

export async function getOrderByPaymentId(paymentId: string): Promise<Order | undefined> {
    if (!isDbConfigured) return undefined;
    noStore();
    try {
        const db = getDb();
        const result = await db`SELECT * FROM orders WHERE payment_id = ${paymentId}`;
        if (result.length === 0) return undefined;
        return mapOrderFromDb(result[0]);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch order by payment ID.');
    }
}

export async function createOrderFromWebhook(paymentData: any): Promise<{newOrder?: Order, error?: string}> {
    if (!isDbConfigured) return createOrderFromWebhookFromHardcodedData(paymentData);
    const { payer, additional_info, transaction_amount, external_reference, id: paymentId } = paymentData;
    if (!external_reference || !additional_info?.items || additional_info.items.length === 0) {
        return { error: 'Webhook data is missing fields to create an order.' };
    }
    const orderData = {
        customerName: payer.first_name ? `${payer.first_name} ${payer.last_name}` : 'N/A',
        customerEmail: payer.email,
        total: transaction_amount,
        status: 'pending',
        items: additional_info.items.map((item: any) => ({ product: { id: parseInt(item.id), name: item.title, price: parseFloat(item.unit_price) }, quantity: parseInt(item.quantity) })),
        shippingAddress: 'N/A', city: 'N/A', postalCode: 'N/A', // Simplified
        paymentId: String(paymentId)
    };
    try {
        const db = getDb();
        const orderResult = await db`
            INSERT INTO orders (id, customer_name, customer_email, total, status, items, payment_id, shipping_address, shipping_city, shipping_postal_code, created_at)
            VALUES (${external_reference}, ${orderData.customerName}, ${orderData.customerEmail}, ${orderData.total}, 'pending', ${JSON.stringify(orderData.items)}::jsonb, ${orderData.paymentId}, ${orderData.shippingAddress}, ${orderData.city}, ${orderData.postalCode}, ${new Date().toISOString()})
            ON CONFLICT (id) DO NOTHING RETURNING *;
        `;
        if (orderResult.length === 0) {
            const existingOrder = await getOrderById(parseInt(String(external_reference), 10));
            return { newOrder: existingOrder };
        }
        return { newOrder: mapOrderFromDb(orderResult[0]) };
    } catch (error: any) {
        console.error('Database Error:', error);
        return { error: error.message || 'Failed to create order from webhook.' };
    }
}

export async function getSalesMetrics(): Promise<SalesMetrics> {
    if (!isDbConfigured) return getSalesMetricsFromHardcodedData();
    noStore();
    try {
        const db = getDb();
        const revenueResult = await db`SELECT SUM(total) as totalRevenue, COUNT(*) as totalSales FROM orders WHERE status IN ('paid', 'delivered')`;
        const { totalrevenue, totalsales } = revenueResult[0];
        const productsResult = await db`
            SELECT (item->'product'->>'id')::int as "productId", item->'product'->>'name' as name, SUM((item->>'quantity')::int) as count
            FROM orders, jsonb_array_elements(items) as item
            WHERE status IN ('paid', 'delivered')
            GROUP BY 1, 2 ORDER BY count DESC LIMIT 5;
        `;
        return {
            totalRevenue: parseFloat(totalrevenue) || 0,
            totalSales: parseInt(totalsales) || 0,
            topSellingProducts: productsResult.map((r: any) => ({ productId: r.productId, name: r.name, count: Number(r.count) }))
        };
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch sales metrics.');
    }
}

export async function getOrders(): Promise<Order[]> {
    if (!isDbConfigured) return getOrdersFromHardcodedData();
    noStore();
    try {
        const db = getDb();
        const rows = await db`SELECT * FROM orders ORDER BY created_at DESC`;
        return rows.map(mapOrderFromDb);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch orders.');
    }
}
