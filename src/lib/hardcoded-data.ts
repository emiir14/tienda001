
'use server';

import type { Product, Coupon, Order, SalesMetrics, OrderData, OrderStatus, Category, CartItem } from './types';

let localCategories: Category[] = [
    // Main Categories (Parents)
    { id: 1, name: "Perfumes", parentId: null },
    { id: 2, name: "Cuidado de Piel", parentId: null },
    { id: 3, name: "Joyas", parentId: null },
    { id: 4, name: "Accesorios", parentId: null },

    // Level 2 Subcategories of "Perfumes" (id: 1)
    { id: 5, name: "Por Marca", parentId: 1 },
    { id: 6, name: "Perfumes Nicho", parentId: 1 },
    { id: 7, name: "Perfumes Árabes", parentId: 1 },
    { id: 8, name: "Por Género", parentId: 1 },

    // Level 3 Brands - Subcategories of "Por Marca" (id: 5)
    { id: 101, name: "Lancôme", parentId: 5 },
    { id: 102, name: "L'Occitane", parentId: 5 },
    { id: 103, name: "Dior", parentId: 5 },
    { id: 104, name: "Chanel", parentId: 5 },
    { id: 105, name: "Gucci", parentId: 5 },
    { id: 106, name: "Tom Ford", parentId: 5 },
    { id: 107, name: "Creed", parentId: 5 },
    { id: 108, name: "Jo Malone", parentId: 5 },
    
    // Level 3 Genders - Subcategories of "Por Género" (id: 8)
    { id: 201, name: "Hombre", parentId: 8 },
    { id: 202, name: "Mujer", parentId: 8 },
    { id: 203, name: "Unisex", parentId: 8 },

    // Level 2 Subcategories of "Cuidado de Piel" (id: 2)
    { id: 301, name: "Rostro", parentId: 2 },
    { id: 302, name: "Cuerpo", parentId: 2 },
    { id: 303, name: "Protectores Solares", parentId: 2 },

    // Level 2 Subcategories of "Joyas" (id: 3)
    { id: 401, name: "Anillos", parentId: 3 },
    { id: 402, name: "Collares", parentId: 3 },
    { id: 403, name: "Pulseras", parentId: 3 },
    { id: 404, name: "Aros", parentId: 3 },
];
let nextCategoryId = 405;

let localProducts: Product[] = [
    {
        id: 1,
        name: "Lancôme La Vie Est Belle",
        description: "Una declaración universal a la belleza de la vida. Una firma olfativa única, encapsulada en el aroma de este perfume dulce que representa una declaración de felicidad.",
        shortDescription: "Eau de Parfum - Floral Frutal.",
        price: 75000,
        images: ["https://i.imgur.com/S9648UV.jpeg"],
        categoryIds: [1, 202, 101], // Perfumes, Mujer, Lancôme
        stock: 15,
        featured: true,
        aiHint: "luxury perfume bottle",
        discountPercentage: 10,
        offerStartDate: new Date('2024-05-01'),
        offerEndDate: new Date('2024-12-31'),
        salePrice: 67500,
    },
    {
        id: 2,
        name: "L'Occitane Karité Crema de Manos",
        description: "Enriquecida con un 20% de manteca de karité orgánica, esta crema de manos se absorbe rápidamente, dejando las manos suaves, nutridas y protegidas.",
        shortDescription: "Crema de manos ultra nutritiva.",
        price: 25000,
        images: ["https://i.imgur.com/urkAB35.jpeg"],
        categoryIds: [2, 302, 102], // Cuidado de Piel, Cuerpo, L'Occitane
        stock: 8,
        featured: true,
        aiHint: "hand cream tube",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
    {
        id: 3,
        name: "Dior Sauvage Elixir",
        description: "Un licor con una estela embriagadora, compuesto por ingredientes excepcionales. Un corazón de especias, una esencia de lavanda 'a medida' y una mezcla de maderas licorosas.",
        shortDescription: "Perfume masculino concentrado.",
        price: 120000,
        images: ["https://i.imgur.com/KzOMf2W.jpeg"],
        categoryIds: [1, 201, 103], // Perfumes, Hombre, Dior
        stock: 12,
        featured: true,
        aiHint: "dark perfume bottle",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
    {
        id: 4,
        name: "Pulsera de Plata con Dije de Corazón",
        description: "Una pulsera de plata de ley 925 con un diseño de cadena fina y un delicado dije de corazón, perfecta para un regalo o para el uso diario.",
        shortDescription: "Pulsera de plata 925.",
        price: 45000,
        images: ["https://i.imgur.com/Jz2e2aG.jpeg"],
        categoryIds: [3, 403], // Joyas, Pulseras
        stock: 25,
        featured: false,
        aiHint: "silver bracelet heart",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
    {
        id: 5,
        name: "Reloj Clásico de Cuero",
        description: "Reloj analógico con movimiento de cuarzo, caja de acero inoxidable y correa de cuero genuino. Un diseño atemporal para cualquier ocasión.",
        price: 85000,
        images: ["https://i.imgur.com/eBq6AMg.png"],
        categoryIds: [4], // Accesorios
        stock: 0, // Out of stock
        featured: true,
        aiHint: "classic leather watch",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
    {
        id: 6,
        name: "Aros de Oro 18k",
        description: "Pequeños aros de oro de 18 quilates con un diseño minimalista y elegante, ideales para el uso diario y para combinar con otras joyas.",
        shortDescription: "Aros de oro minimalistas.",
        price: 60000,
        images: ["https://i.imgur.com/vHqB5oW.png"],
        categoryIds: [3, 404], // Joyas, Aros
        stock: 20,
        featured: false,
        aiHint: "gold earrings",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
    {
        id: 7,
        name: "Chanel Nº5",
        description: "El perfume por excelencia. Un bouquet floral aldehído, una composición intemporal y legendaria.",
        shortDescription: "El icónico perfume femenino.",
        price: 115000,
        images: ["https://i.imgur.com/a4g5v5w.jpeg"],
        categoryIds: [1, 202, 104], // Perfumes, Mujer, Chanel
        stock: 10,
        featured: false,
        aiHint: "classic perfume bottle",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
    {
        id: 8,
        name: "Sérum Hidratante con Ácido Hialurónico",
        description: "Un sérum ligero que proporciona una hidratación intensa y duradera para una piel suave y flexible.",
        shortDescription: "Sérum facial de hidratación profunda.",
        price: 35000,
        images: ["https://i.imgur.com/xVwDODZ.png"],
        categoryIds: [2, 301], // Cuidado de Piel, Rostro
        stock: 30,
        featured: false,
        aiHint: "skincare serum bottle",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
    {
        id: 9,
        name: "Collar de Perlas Cultivadas",
        description: "Un collar clásico de perlas cultivadas de agua dulce, anudadas a mano con un broche de plata.",
        shortDescription: "Collar de perlas clásico.",
        price: 95000,
        images: ["https://i.imgur.com/gY5zP8W.png"],
        categoryIds: [3, 402], // Joyas, Collares
        stock: 8,
        featured: true,
        aiHint: "pearl necklace",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
    {
        id: 10,
        name: "Gafas de Sol Estilo Aviador",
        description: "Gafas de sol unisex con montura metálica y lentes polarizadas con protección UV400.",
        shortDescription: "Gafas de sol clásicas.",
        price: 30000,
        images: ["https://i.imgur.com/uTjZ0eR.png"],
        categoryIds: [4], // Accesorios
        stock: 40,
        featured: false,
        aiHint: "aviator sunglasses",
        discountPercentage: 15,
        offerStartDate: new Date('2024-06-01'),
        offerEndDate: new Date('2024-08-31'),
        salePrice: 25500,
    },
    {
        id: 11,
        name: "Anillo de Compromiso Solitario",
        description: "Anillo de oro blanco de 14k con un diamante de corte brillante de 0.5 quilates.",
        shortDescription: "Anillo de diamante solitario.",
        price: 250000,
        images: ["https://i.imgur.com/a9rDTEK.png"],
        categoryIds: [3, 401], // Joyas, Anillos
        stock: 3,
        featured: false,
        aiHint: "diamond ring",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
    {
        id: 12,
        name: "Gucci Bloom",
        description: "Una fragancia que captura el espíritu de la mujer contemporánea, diversa y auténtica.",
        shortDescription: "Eau de Parfum floral.",
        price: 98000,
        images: ["https://i.imgur.com/vBJIb2u.jpeg"],
        categoryIds: [1, 202, 105], // Perfumes, Mujer, Gucci
        stock: 18,
        featured: false,
        aiHint: "pink perfume bottle",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
    {
        id: 13,
        name: "Protector Solar FPS 50+",
        description: "Protector solar de amplio espectro con una textura ligera y no grasa, resistente al agua.",
        shortDescription: "Protector solar facial y corporal.",
        price: 22000,
        images: ["https://i.imgur.com/R3I0aKu.png"],
        categoryIds: [2, 303], // Cuidado de Piel, Protectores Solares
        stock: 50,
        featured: false,
        aiHint: "sunscreen bottle",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
    {
        id: 14,
        name: "Pañuelo de Seda Estampado",
        description: "Un pañuelo de seda 100% natural con un vibrante estampado floral, perfecto para el cuello o como accesorio para el bolso.",
        shortDescription: "Pañuelo de seda natural.",
        price: 28000,
        images: ["https://i.imgur.com/kP8zY4T.png"],
        categoryIds: [4], // Accesorios
        stock: 22,
        featured: true,
        aiHint: "silk scarf pattern",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
    {
        id: 15,
        name: "Tom Ford Tobacco Vanille",
        description: "Una opulenta fragancia artesanal con tabaco especiado y vainilla cremosa. Lujosa, cálida y emblemática.",
        shortDescription: "Perfume unisex de lujo.",
        price: 180000,
        images: ["https://i.imgur.com/3q1s3xL.jpeg"],
        categoryIds: [1, 6, 203, 106], // Perfumes, Nicho, Unisex, Tom Ford
        stock: 7,
        featured: true,
        aiHint: "dark luxury perfume",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
     {
        id: 16,
        name: "Mascarilla Facial de Arcilla",
        description: "Mascarilla purificante con arcilla verde y aceite de árbol de té para limpiar los poros en profundidad.",
        shortDescription: "Mascarilla facial purificante.",
        price: 18000,
        images: ["https://i.imgur.com/qF0k3hY.png"],
        categoryIds: [2, 301], // Cuidado de Piel, Rostro
        stock: 35,
        featured: false,
        aiHint: "clay face mask jar",
        discountPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
        salePrice: null,
    },
].map(p => ({ ...p, salePrice: _calculateSalePrice(p) }));

let localCoupons: Coupon[] = [
    {
        id: 1,
        code: 'VERANO20',
        discountType: 'percentage',
        discountValue: 20,
        expiryDate: new Date('2024-12-31'),
        isActive: true,
    },
    {
        id: 2,
        code: 'ENVIOFREE',
        discountType: 'fixed',
        discountValue: 15,
        expiryDate: null,
        isActive: true,
    },
     {
        id: 3,
        code: 'EXPIRADO',
        discountType: 'percentage',
        discountValue: 10,
        expiryDate: new Date('2023-01-01'),
        isActive: true,
    },
     {
        id: 4,
        code: 'INACTIVO',
        discountType: 'fixed',
        discountValue: 50,
        expiryDate: null,
        isActive: false,
    }
];

let localOrders: Order[] = [];
let nextOrderId = 1;

function _calculateSalePrice(product: Omit<Product, 'id' | 'salePrice'>): number | null {
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

export async function getProducts(): Promise<Product[]> {
    return JSON.parse(JSON.stringify(localProducts));
}

export async function getProductById(id: number): Promise<Product | undefined> {
    const product = localProducts.find((p) => p.id === id);
    return product ? JSON.parse(JSON.stringify(product)) : undefined;
}

export async function createProduct(product: Omit<Product, 'id' | 'salePrice'>): Promise<Product> {
    const newId = (localProducts.reduce((max, p) => Math.max(p.id, max), 0)) + 1;
    const newProduct: Product = { ...product, id: newId, salePrice: null };
    localProducts.unshift({ ...newProduct, salePrice: _calculateSalePrice(newProduct) });
    return newProduct;
}

export async function updateProduct(id: number, productData: Partial<Omit<Product, 'id' | 'salePrice'>>): Promise<Product> {
    const productIndex = localProducts.findIndex(p => p.id === id);
    if (productIndex === -1) throw new Error("Product not found");
    const updatedProduct = { ...localProducts[productIndex], ...productData };
    localProducts[productIndex] = { ...updatedProduct, salePrice: _calculateSalePrice(updatedProduct) };
    return localProducts[productIndex];
}

export async function deleteProduct(id: number): Promise<void> {
    const productIndex = localProducts.findIndex(p => p.id === id);
    if (productIndex === -1) {
        console.warn(`Attempted to delete product with id ${id}, but it was not found.`);
        return;
    };
    localProducts.splice(productIndex, 1);
}

// Category Functions
export async function getCategories(): Promise<Category[]> {
    return JSON.parse(JSON.stringify(localCategories));
}

export async function createCategory(name: string): Promise<Category> {
    if (localCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        throw new Error(`La categoría '${name}' ya existe.`);
    }
    const newCategory = { id: nextCategoryId++, name, parentId: null };
    localCategories.push(newCategory);
    return newCategory;
}

export async function deleteCategory(id: number): Promise<{ success: boolean, message?: string }> {
    const isCategoryInUse = localProducts.some(p => p.categoryIds.includes(id));
    if (isCategoryInUse) {
        return { success: false, message: 'No se puede eliminar la categoría porque está asignada a uno o más productos.' };
    }
    const index = localCategories.findIndex(c => c.id === id);
    if (index > -1) {
        localCategories.splice(index, 1);
        return { success: true };
    }
    return { success: false, message: 'Categoría no encontrada.' };
}


export async function getCoupons(): Promise<Coupon[]> {
    return JSON.parse(JSON.stringify(localCoupons));
}

export async function getCouponById(id: number): Promise<Coupon | undefined> {
    const coupon = localCoupons.find(c => c.id === id);
    return coupon ? JSON.parse(JSON.stringify(coupon)) : undefined;
}

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
    const coupon = localCoupons.find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (coupon && coupon.isActive && (!coupon.expiryDate || new Date(coupon.expiryDate) > new Date())) {
        return JSON.parse(JSON.stringify(coupon));
    }
    return undefined;
}

export async function createCoupon(coupon: Omit<Coupon, 'id'>): Promise<Coupon> {
    if (localCoupons.some(c => c.code.toUpperCase() === coupon.code.toUpperCase())) {
        throw new Error(`El código de cupón '${coupon.code}' ya existe.`);
    }
    const newId = (localCoupons.reduce((max, p) => Math.max(p.id, max), 0)) + 1;
    const newCoupon = { ...coupon, id: newId };
    localCoupons.unshift(newCoupon);
    return newCoupon;
}

export async function updateCoupon(id: number, couponData: Partial<Omit<Coupon, 'id'>>): Promise<Coupon> {
    const couponIndex = localCoupons.findIndex(c => c.id === id);
    if (couponIndex === -1) throw new Error("Coupon not found");
    if (couponData.code && localCoupons.some(c => c.id !== id && c.code.toUpperCase() === couponData.code!.toUpperCase())) {
        throw new Error(`El código de cupón '${couponData.code}' ya existe.`);
    }
    const updatedCoupon = { ...localCoupons[couponIndex], ...couponData };
    localCoupons[couponIndex] = updatedCoupon;
    return updatedCoupon;
}

export async function deleteCoupon(id: number): Promise<void> {
    const couponIndex = localCoupons.findIndex(c => c.id === id);
    if (couponIndex === -1) {
        console.warn(`Attempted to delete coupon with id ${id}, but it was not found.`);
        return;
    }
    localCoupons.splice(couponIndex, 1);
}

export async function getSalesMetrics(): Promise<SalesMetrics> {
    const paidOrders = localOrders.filter(o => o.status === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalSales = paidOrders.length;
    
    const productCounts = paidOrders
        .flatMap(o => o.items)
        .reduce((acc, item) => {
            const productId = item.product.id;
            acc[productId] = (acc[productId] || 0) + item.quantity;
            return acc;
        }, {} as Record<number, number>);

    const topSellingProducts = Object.entries(productCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5)
        .map(([productIdStr, count]) => {
            const productId = Number(productIdStr);
            return {
                productId,
                name: localProducts.find(p => p.id === productId)?.name || 'Unknown Product',
                count: count,
            }
        });

    return { totalRevenue, totalSales, topSellingProducts };
}

export async function createOrder(orderData: OrderData): Promise<{orderId?: number, error?: string}> {
    for (const item of orderData.items) {
        const product = localProducts.find(p => p.id === item.product.id);
        if (!product || product.stock < item.quantity) {
            return { error: `Stock insuficiente para el producto: ${item.product.name}` };
        }
        product.stock -= item.quantity;
    }
    
    const newOrder: Order = {
        id: nextOrderId++,
        ...orderData,
        createdAt: new Date(),
    };
    localOrders.unshift(newOrder);

    return { orderId: newOrder.id };
}

export async function updateOrderStatus(orderId: number, status: OrderStatus, paymentId?: string): Promise<void> {
    const order = localOrders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        if(paymentId) order.paymentId = paymentId;
    }
}

export async function restockItemsForOrder(orderId: number): Promise<void> {
    const order = localOrders.find(o => o.id === orderId);
    if (order && order.status !== 'paid' && order.status !== 'shipped') {
        for (const item of order.items) {
            const product = localProducts.find(p => p.id === item.product.id);
            if (product) {
                product.stock += item.quantity;
            }
        }
        console.log(`Restocked items for cancelled/failed order ${orderId}`);
    } else if (order) {
        console.log(`Skipped restocking for order ${orderId} with status ${order.status}`);
    }
}

export async function getOrderById(id: number): Promise<Order | undefined> {
    const order = localOrders.find(o => o.id === id);
    return order ? JSON.parse(JSON.stringify(order)) : undefined;
}


export async function createOrderFromWebhook(paymentData: any): Promise<{ newOrder?: Order; error?: string }> {
    const { external_reference } = paymentData;
    const orderId = parseInt(external_reference, 10);
    
    if (await getOrderById(orderId)) {
        console.log(`Order ${orderId} already exists. Skipping creation from webhook.`);
        return { newOrder: await getOrderById(orderId) };
    }
    
    // Simplified creation for fallback
     const items: CartItem[] = paymentData.additional_info.items.map((item: any) => {
        const product = localProducts.find(p => p.id === parseInt(item.id)) || {
            id: parseInt(item.id),
            name: item.title,
            price: parseFloat(item.unit_price),
            images: [],
            categoryIds: [],
            stock: 0,
            description: item.description,
        };
        return { product, quantity: parseInt(item.quantity) };
    });


    const orderData: OrderData = {
        customerName: paymentData.payer?.first_name ? `${paymentData.payer.first_name} ${paymentData.payer.last_name || ''}`.trim() : 'N/A',
        customerEmail: paymentData.payer.email,
        total: paymentData.transaction_amount,
        status: 'pending',
        items,
        shippingAddress: 'N/A from webhook',
        shippingCity: 'N/A from webhook',
        shippingPostalCode: 'N/A from webhook',
        paymentId: String(paymentData.id),
    };

    const newOrder: Order = {
        id: orderId,
        ...orderData,
        createdAt: new Date(),
    };
    localOrders.unshift(newOrder);
    console.log(`Created new order ${orderId} from webhook as a fallback.`);
    return { newOrder };
}


export async function getOrders(): Promise<Order[]> {
    // Simulate some recent orders for demonstration purposes
    if (localOrders.length === 0) {
        const product1 = await getProductById(1);
        const product4 = await getProductById(4);
        if (product1 && product4) {
             localOrders = [
                {
                    id: 1,
                    customerName: "Juan Pérez",
                    customerEmail: "juan.perez@example.com",
                    total: 75000,
                    status: 'paid',
                    createdAt: new Date('2024-07-20T10:30:00Z'),
                    items: [{ product: product1, quantity: 1 }],
                    paymentId: '123456789',
                    shippingAddress: 'Av. Corrientes 123',
                    shippingCity: 'CABA',
                    shippingPostalCode: '1043',
                },
                {
                    id: 2,
                    customerName: "Maria García",
                    customerEmail: "maria.garcia@example.com",
                    total: 45000,
                    status: 'shipped',
                    createdAt: new Date('2024-07-19T15:00:00Z'),
                    items: [{ product: product4, quantity: 1 }],
                    paymentId: '987654321',
                    shippingAddress: 'Calle Falsa 123',
                    shippingCity: 'Springfield',
                    shippingPostalCode: 'B7500',
                },
                {
                    id: 3,
                    customerName: "Carlos López",
                    customerEmail: "carlos.lopez@example.com",
                    total: 120000,
                    status: 'pending',
                    createdAt: new Date('2024-07-21T09:00:00Z'),
                    items: [{ product: (await getProductById(3))!, quantity: 1 }],
                    shippingAddress: 'Av. de Mayo 567',
                    shippingCity: 'CABA',
                    shippingPostalCode: '1084',
                },
             ];
             nextOrderId = 4;
        }
    }
    return JSON.parse(JSON.stringify(localOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())));
}
