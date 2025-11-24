
'use server';

import { getDb, isDbConfigured } from '../db';
import {
    getProducts as getProductsFromHardcodedData,
    getProductById as getProductByIdFromHardcodedData,
    createProduct as createProductFromHardcodedData,
    updateProduct as updateProductFromHardcodedData,
    deleteProduct as deleteProductFromHardcodedData,
} from '../hardcoded-data';
import type { Product } from '../types';
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
        sku: product.sku,
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
    // Safely parse the images field, which might be a JSON string or an array
    let parsedImages: string[] = [];
    if (row.images) {
        if (typeof row.images === 'string') {
            try {
                parsedImages = JSON.parse(row.images);
            } catch (e) {
                // Fallback for non-JSON string, assuming it might be a single URL
                parsedImages = [row.images];
            }
        } else {
            parsedImages = row.images;
        }
    }

    const product: Product = {
        id: row.id,
        name: row.name,
        description: row.description,
        shortDescription: row.short_description,
        price: parseFloat(row.price),
        images: parsedImages, // Use the parsed images
        categoryIds: row.category_ids || [],
        stock: row.stock,
        sku: row.sku,
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
                name, description, short_description, price, images, stock, "sku",
                ai_hint, featured, discount_percentage, offer_start_date, offer_end_date
            ) VALUES (
                ${newProductData.name}, ${newProductData.description}, ${newProductData.shortDescription}, 
                ${newProductData.price}, ${newProductData.images}, ${newProductData.stock}, ${newProductData.sku},
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
    const { name, description, shortDescription, price, images, categoryIds, stock, sku, aiHint, featured, discountPercentage, offerStartDate, offerEndDate } = productData;
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
                "sku" = COALESCE(${sku}, "sku"),
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
