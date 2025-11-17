'use server';

import { getDb } from './db';
import type { Coupon, SalesMetrics, OrderData, OrderStatus, Order, Category } from './types';
import { unstable_noStore as noStore } from 'next/cache';

function _mapDbRowToCategory(row: any): Category {
    return { id: row.id, name: row.name, parentId: row.parent_id };
}

export async function getCategories(): Promise<Category[]> {
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

export async function createCategory(name: string, parentId: number | null = null): Promise<Category> {
    try {
        const db = getDb();
        const result = await db`INSERT INTO categories (name, parent_id) VALUES (${name}, ${parentId}) RETURNING *;`;
        return _mapDbRowToCategory(result[0]);
    } catch (error: any) {
        if (error.message.includes('duplicate key value')) {
            throw new Error(`La categoría '${name}' ya existe.`);
        }
        console.error('Database Error:', error);
        throw new Error('Failed to create category.');
    }
}

export async function updateCategory(id: number, name: string): Promise<Category> {
    try {
        const db = getDb();
        const result = await db`UPDATE categories SET name = ${name} WHERE id = ${id} RETURNING *;`;
        if (result.length === 0) throw new Error("Category not found.");
        return _mapDbRowToCategory(result[0]);
    } catch (error: any) {
        if (error.message.includes('duplicate key value')) {
            throw new Error(`El nombre de categoría '${name}' ya está en uso.`);
        }
        console.error('Database Error:', error);
        throw new Error('Failed to update category.');
    }
}

export async function deleteCategory(id: number): Promise<{ success: boolean; message?: string }> {
    try {
        const db = getDb();
        // Check if category has children
        const children = await db`SELECT 1 FROM categories WHERE parent_id = ${id} LIMIT 1`;
        if (children.length > 0) {
            return { success: false, message: 'No se puede eliminar. La categoría tiene subcategorías asociadas.' };
        }
        // Check if category is assigned to products
        const products = await db`SELECT 1 FROM product_categories WHERE category_id = ${id} LIMIT 1`;
        if (products.length > 0) {
            return { success: false, message: 'No se puede eliminar. La categoría está asignada a uno o más productos.' };
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
        minPurchaseAmount: row.min_purchase_amount ? parseFloat(row.min_purchase_amount) : null,
        expiryDate: row.expiry_date,
        isActive: row.is_active,
    };
}

export async function getCoupons(): Promise<Coupon[]> {
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
    const { code, discountType, discountValue, minPurchaseAmount, expiryDate, isActive } = coupon;
    try {
        const db = getDb();
        const result = await db`
            INSERT INTO coupons (code, discount_type, discount_value, min_purchase_amount, expiry_date, is_active)
            VALUES (${code.toUpperCase()}, ${discountType}, ${discountValue}, ${minPurchaseAmount}, ${expiryDate?.toISOString()}, ${isActive})
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
    const { code, discountType, discountValue, minPurchaseAmount, expiryDate, isActive } = couponData;
    try {
        const db = getDb();
        const result = await db`
            UPDATE coupons
            SET code = COALESCE(${code?.toUpperCase()}, code), 
                discount_type = COALESCE(${discountType}, discount_type), 
                discount_value = COALESCE(${discountValue}, discount_value), 
                min_purchase_amount = COALESCE(${minPurchaseAmount}, min_purchase_amount),
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
    try {
        const db = getDb();
        await db`DELETE FROM coupons WHERE id = ${id}`;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to delete coupon.');
    }
}

export async function createOrder(orderData: OrderData): Promise<{orderId?: number, error?: string}> {
    try {
        const db = getDb();
        for (const item of orderData.items) {
            const productResult = await db`SELECT stock, name FROM products WHERE id = ${item.product.id}`;
            if (productResult.length === 0) return { error: `Producto no encontrado: ${item.product.id}` };
            if (productResult[0].stock < item.quantity) {
                return { error: `Stock insuficiente para \\\"${productResult[0].name}\\\".` };
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
    noStore();
    try {
        const db = getDb();
        const revenueResult = await db`SELECT SUM(total) as totalRevenue, COUNT(*) as totalSales FROM orders WHERE status IN ('paid', 'delivered')`;
        const { totalrevenue, totalsales } = revenueResult[0];
        const productsResult = await db`
            SELECT (item->'product'->>'id')::int as "productId", item->'product'->>'name\' as name, SUM((item->>\'quantity\')::int) as count
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
