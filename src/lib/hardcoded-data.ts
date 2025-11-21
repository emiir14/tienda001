
'use server';

import type { Product, Coupon, Order, SalesMetrics, OrderData, OrderStatus, Category, CartItem, DeliveryMethod } from './types';

// --- DATOS EN MEMORIA (REEMPLAZAR CON BASE DE DATOS REAL) ---

let localCategories: Category[] = [
    { id: 1, name: "Perfumes", parentId: null },
    { id: 2, name: "Cuidado de Piel", parentId: null },
    { id: 3, name: "Joyas", parentId: null },
    { id: 4, name: "Accesorios", parentId: null },
    { id: 5, name: "Por Marca", parentId: 1 },
    { id: 6, name: "Perfumes Nicho", parentId: 1 },
    { id: 7, name: "Perfumes Árabes", parentId: 1 },
    { id: 8, name: "Por Género", parentId: 1 },
    { id: 101, name: "Lancôme", parentId: 5 },
    { id: 102, name: "L'Occitane", parentId: 5 },
    { id: 103, name: "Dior", parentId: 5 },
    { id: 104, name: "Chanel", parentId: 5 },
    { id: 105, name: "Gucci", parentId: 5 },
    { id: 106, name: "Tom Ford", parentId: 5 },
    { id: 107, name: "Creed", parentId: 5 },
    { id: 108, name: "Jo Malone", parentId: 5 },
    { id: 201, name: "Hombre", parentId: 8 },
    { id: 202, name: "Mujer", parentId: 8 },
    { id: 203, name: "Unisex", parentId: 8 },
    { id: 301, name: "Rostro", parentId: 2 },
    { id: 302, name: "Cuerpo", parentId: 2 },
    { id: 303, name: "Protectores Solares", parentId: 2 },
    { id: 401, name: "Anillos", parentId: 3 },
    { id: 402, name: "Collares", parentId: 3 },
    { id: 403, name: "Pulseras", parentId: 3 },
    { id: 404, name: "Aros", parentId: 3 },
];
let nextCategoryId = 405;

let localProducts: Product[] = [
    {
        id: 1, name: "Lancôme La Vie Est Belle",
        description: "Una declaración universal a la belleza de la vida. Una firma olfativa única, encapsulada en el aroma de este perfume dulce que representa una declaración de felicidad.",
        shortDescription: "Eau de Parfum - Floral Frutal.", price: 75000, images: ["https://i.imgur.com/YpTWZYd.jpg"],
        categoryIds: [1, 202, 101], stock: 15, featured: true, aiHint: "luxury perfume bottle",
        discountPercentage: 10, offerStartDate: new Date('2024-05-01'), offerEndDate: new Date('2024-12-31'), salePrice: 67500,
    },
    {
        id: 2, name: "L'Occitane Karité Crema de Manos",
        description: "Enriquecida con un 20% de manteca de karité orgánica, esta crema de manos se absorbe rápidamente, dejando las manos suaves, nutridas y protegidas.",
        shortDescription: "Crema de manos ultra nutritiva.", price: 25000, images: ["https://i.imgur.com/9KVrNqX.jpg"],
        categoryIds: [2, 302, 102], stock: 8, featured: true, aiHint: "hand cream tube",
        discountPercentage: null, offerStartDate: null, offerEndDate: null, salePrice: null,
    },
    {
        id: 3, name: "Dior Sauvage Elixir",
        description: "Un licor con una estela embriagadora, compuesto por ingredientes excepcionales. Un corazón de especias, una esencia de lavanda 'a medida' y una mezcla de maderas licorosas.",
        shortDescription: "Perfume masculino concentrado.", price: 120000, images: ["https://i.imgur.com/xF3pK2L.jpg"],
        categoryIds: [1, 201, 103], stock: 12, featured: true, aiHint: "dark perfume bottle",
        discountPercentage: null, offerStartDate: null, offerEndDate: null, salePrice: null,
    },
    {
        id: 4, name: "Pulsera de Plata con Dije de Corazón",
        description: "Una pulsera de plata de ley 925 con un diseño de cadena fina y un delicado dije de corazón, perfecta para un regalo o para el uso diario.",
        shortDescription: "Pulsera de plata 925.", price: 45000, images: ["https://i.imgur.com/2qxVfHj.jpg"],
        categoryIds: [3, 403], stock: 25, featured: false, aiHint: "silver bracelet heart",
        discountPercentage: 15, offerStartDate: new Date('2024-07-01'), offerEndDate: new Date('2024-09-30'), salePrice: 38250,
    },
    {
        id: 5, name: "Reloj Clásico de Cuero",
        description: "Reloj analógico con movimiento de cuarzo, caja de acero inoxidable y correa de cuero genuino. Un diseño atemporal para cualquier ocasión.",
        price: 85000, images: ["https://i.imgur.com/7zJ9wNd.jpg"], categoryIds: [4], stock: 0,
        featured: true, aiHint: "classic leather watch", discountPercentage: null, offerStartDate: null, offerEndDate: null, salePrice: null,
    },
    {
        id: 6, name: "Aros de Oro 18k",
        description: "Pequeños aros de oro de 18 quilates con un diseño minimalista y elegante, ideales para el uso diario y para combinar con otras joyas.",
        shortDescription: "Aros de oro minimalistas.", price: 60000, images: ["https://i.imgur.com/kL8hPmQ.jpg"],
        categoryIds: [3, 404], stock: 20, featured: false, aiHint: "gold earrings",
        discountPercentage: null, offerStartDate: null, offerEndDate: null, salePrice: null,
    },
    {
        id: 9, name: "Collar de Perlas Cultivadas",
        description: "Un collar clásico de perlas cultivadas de agua dulce, anudadas a mano con un broche de plata.",
        shortDescription: "Collar de perlas clásico.", price: 95000, images: ["https://i.imgur.com/8RzPnXe.jpg"],
        categoryIds: [3, 402], stock: 8, featured: true, aiHint: "pearl necklace",
        discountPercentage: null, offerStartDate: null, offerEndDate: null, salePrice: null,
    },
].map(p => ({ ...p, salePrice: _calculateSalePrice(p) }));

let localCoupons: Coupon[] = [
    { id: 1, code: 'WINTER15', discountType: 'percentage', discountValue: 15, expiryDate: new Date('2024-09-30'), isActive: true },
    { id: 2, code: 'BIENVENIDA', discountType: 'fixed', discountValue: 5000, expiryDate: null, isActive: true },
    { id: 3, code: 'EXPIRADO', discountType: 'percentage', discountValue: 10, expiryDate: new Date('2023-01-01'), isActive: true },
    { id: 4, code: 'INACTIVO', discountType: 'fixed', discountValue: 50, expiryDate: null, isActive: false }
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

// Funciones CRUD (sin cambios)
export async function getProducts(): Promise<Product[]> { return JSON.parse(JSON.stringify(localProducts)); }
export async function getProductById(id: number): Promise<Product | undefined> { 
    const product = localProducts.find((p) => p.id === id);
    return product ? JSON.parse(JSON.stringify(product)) : undefined;
}
export async function createProduct(product: Omit<Product, 'id' | 'salePrice'>): Promise<Product> { /* ... */ return {} as any; }
export async function updateProduct(id: number, productData: Partial<Omit<Product, 'id' | 'salePrice'>>): Promise<Product> { /* ... */ return {} as any; }
export async function deleteProduct(id: number): Promise<void> { /* ... */ }
export async function getCategories(): Promise<Category[]> { return JSON.parse(JSON.stringify(localCategories)); }
export async function createCategory(name: string): Promise<Category> { /* ... */ return {} as any; }
export async function deleteCategory(id: number): Promise<{ success: boolean, message?: string }> { return { success: true }; }
export async function getCoupons(): Promise<Coupon[]> { return JSON.parse(JSON.stringify(localCoupons)); }
export async function getCouponById(id: number): Promise<Coupon | undefined> { return undefined; }
export async function getCouponByCode(code: string): Promise<Coupon | undefined> { /* ... */ return undefined; }
export async function createCoupon(coupon: Omit<Coupon, 'id'>): Promise<Coupon> { /* ... */ return {} as any; }
export async function updateCoupon(id: number, couponData: Partial<Omit<Coupon, 'id'>>): Promise<Coupon> { /* ... */ return {} as any; }
export async function deleteCoupon(id: number): Promise<void> { /* ... */ }
export async function getSalesMetrics(): Promise<SalesMetrics> { /* ... */ return {} as any; }

// --- FUNCIONES DE ÓRDENES CORREGIDAS ---

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
            if (product) product.stock += item.quantity;
        }
    }
}

export async function getOrderById(id: number): Promise<Order | undefined> {
    const order = localOrders.find(o => o.id === id);
    return order ? JSON.parse(JSON.stringify(order)) : undefined;
}

export async function createOrderFromWebhook(paymentData: any): Promise<{ newOrder?: Order; error?: string }> {
    const orderId = parseInt(paymentData.external_reference, 10);
    if (await getOrderById(orderId)) return { newOrder: await getOrderById(orderId) };
    
    const items: CartItem[] = paymentData.additional_info.items.map((item: any) => ({ 
        product: { id: parseInt(item.id), name: item.title, price: parseFloat(item.unit_price) } as Product,
        quantity: parseInt(item.quantity) 
    }));

    // CORRECCIÓN: Se usa 'pending_payment' y se agrega 'deliveryMethod'
    const orderData: OrderData = {
        customerName: paymentData.payer?.first_name ? `${paymentData.payer.first_name} ${paymentData.payer.last_name || ''}`.trim() : 'N/A',
        customerEmail: paymentData.payer.email,
        total: paymentData.transaction_amount,
        status: 'pending_payment', // <--- CORREGIDO
        items,
        deliveryMethod: 'shipping', // <--- AÑADIDO
        shippingAddress: 'N/A from webhook',
        shippingCity: 'N/A from webhook',
        shippingPostalCode: 'N/A from webhook',
        paymentId: String(paymentData.id),
    };

    const newOrder: Order = { id: orderId, ...orderData, createdAt: new Date() };
    localOrders.unshift(newOrder);
    return { newOrder };
}

export async function getOrders(): Promise<Order[]> {
    if (localOrders.length === 0) {
        const product1 = await getProductById(1);
        const product4 = await getProductById(4);
        const product3 = await getProductById(3);
        if (product1 && product4 && product3) {
             localOrders = [
                {
                    id: 1, customerName: "Juan Pérez", customerEmail: "juan.perez@example.com",
                    total: 67500, status: 'paid', createdAt: new Date('2024-07-20T10:30:00Z'),
                    items: [{ product: product1, quantity: 1 }], paymentId: '123456789',
                    deliveryMethod: 'shipping', // <--- AÑADIDO
                    shippingAddress: 'Av. Corrientes 123', shippingCity: 'CABA', shippingPostalCode: '1043',
                },
                {
                    id: 2, customerName: "Maria García", customerEmail: "maria.garcia@example.com",
                    total: 38250, status: 'shipped', createdAt: new Date('2024-07-19T15:00:00Z'),
                    items: [{ product: product4, quantity: 1 }], paymentId: '987654321',
                    deliveryMethod: 'pickup', // <--- AÑADIDO
                    shippingAddress: 'N/A', shippingCity: 'N/A', shippingPostalCode: 'N/A',
                    pickupName: 'Maria García', pickupDni: '12345678'
                },
                {
                    id: 3, customerName: "Carlos López", customerEmail: "carlos.lopez@example.com",
                    total: 120000, status: 'pending_payment', createdAt: new Date('2024-07-21T09:00:00Z'),
                    items: [{ product: product3, quantity: 1 }],
                    deliveryMethod: 'shipping', // <--- AÑADIDO
                    shippingAddress: 'Av. de Mayo 567', shippingCity: 'CABA', shippingPostalCode: '1084',
                },
             ];
             nextOrderId = 4;
        }
    }
    return JSON.parse(JSON.stringify(localOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())));
}
