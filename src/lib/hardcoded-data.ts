'use server';

import type { Product, Coupon, Order, SalesMetrics, OrderData, OrderStatus, Category, OrderItem, DeliveryMethod } from './types';

// --- DATOS EN MEMORIA (REEMPLAZAR CON BASE DE DATOS REAL) ---






let localCategories: Category[] = [
    { id: 1, name: "Perfumes" },{ id: 2, name: "Cuidado de Piel" },{ id: 3, name: "Joyas" },{ id: 4, name: "Accesorios" },{ id: 5, name: "Por Marca", parentId: 1 },{ id: 6, name: "Perfumes Nicho", parentId: 1 },{ id: 7, name: "Perfumes Árabes", parentId: 1 },{ id: 8, name: "Por Género", parentId: 1 },{ id: 101, name: "Lancôme", parentId: 5 },{ id: 102, name: "L'Occitane", parentId: 5 },{ id: 103, name: "Dior", parentId: 5 },{ id: 104, name: "Chanel", parentId: 5 },{ id: 105, name: "Gucci", parentId: 5 },{ id: 106, name: "Tom Ford", parentId: 5 },{ id: 107, name: "Creed", parentId: 5 },{ id: 108, name: "Jo Malone", parentId: 5 },{ id: 201, name: "Hombre", parentId: 8 },{ id: 202, name: "Mujer", parentId: 8 },{ id: 203, name: "Unisex", parentId: 8 },{ id: 301, name: "Rostro", parentId: 2 },{ id: 302, name: "Cuerpo", parentId: 2 },{ id: 303, name: "Protectores Solares", parentId: 2 },{ id: 401, name: "Anillos", parentId: 3 },{ id: 402, name: "Collares", parentId: 3 },{ id: 403, name: "Pulseras", parentId: 3 },{ id: 404, name: "Aros", parentId: 3 },
];

let localProducts: Product[] = [
    { id: 1, name: "Lancôme La Vie Est Belle", description: "Perfume floral y dulce.", shortDescription: "Eau de Parfum.", price: 75000, images: ["https://i.imgur.com/YpTWZYd.jpg"], categoryIds: [1, 202, 101], stock: 15, discountPercentage: 10, offerStartDate: new Date('2024-05-01'), offerEndDate: new Date('2024-12-31') },
    { id: 2, name: "L'Occitane Karité Crema de Manos", description: "Crema nutritiva.", shortDescription: "Ideal para piel seca.", price: 25000, images: ["https://i.imgur.com/9KVrNqX.jpg"], categoryIds: [2, 302, 102], stock: 8 },
    { id: 3, name: "Dior Sauvage Elixir", description: "Perfume concentrado.", shortDescription: "Aroma especiado y amaderado.", price: 120000, images: ["https://i.imgur.com/xF3pK2L.jpg"], categoryIds: [1, 201, 103], stock: 12 },
    { id: 4, name: "Pulsera de Plata con Dije de Corazón", description: "Plata 925.", shortDescription: "Diseño delicado.", price: 45000, images: ["https://i.imgur.com/2qxVfHj.jpg"], categoryIds: [3, 403], stock: 25, discountPercentage: 15, offerStartDate: new Date('2024-07-01'), offerEndDate: new Date('2024-09-30') },
].map(p => ({ ...p, salePrice: _calculateSalePrice(p) }));

let localCoupons: Coupon[] = [{ id: 1, code: 'WINTER15', discountType: 'percentage', discountValue: 15, expiryDate: new Date('2024-09-30'), isActive: true }];
let localOrders: Order[] = [];
let nextOrderId = 1;
let nextProductId = 5;

// --- FUNCIÓN CORREGIDA PARA SEGURIDAD DE TIPOS ---
function _calculateSalePrice(product: Partial<Product>): number | null {
    const now = new Date();
    const isOfferDateValid = product.offerStartDate && product.offerEndDate && now >= new Date(product.offerStartDate) && now <= new Date(product.offerEndDate);

    // Se verifica explícitamente que los valores numéricos existan antes de usarlos
    if (isOfferDateValid && typeof product.price === 'number' && typeof product.discountPercentage === 'number' && product.discountPercentage > 0) {
        const discount = product.price * (product.discountPercentage / 100);
        return parseFloat((product.price - discount).toFixed(2));
    }

    return product.salePrice ?? null;
}

// --- FUNCIONES CRUD (SIN CAMBIOS) ---
export async function getProducts(): Promise<Product[]> { return JSON.parse(JSON.stringify(localProducts)); }
export async function getProductById(id: number): Promise<Product | undefined> { return localProducts.find(p => p.id === id); }

// --- LÓGICA DE ÓRDENES (YA CORREGIDA) ---
export async function createOrder(orderData: OrderData): Promise<{orderId?: number, error?: string}> {
    for (const item of orderData.items) {
        const product = localProducts.find(p => p.id === item.productId);
        if (!product || product.stock < item.quantity) {
            return { error: `Stock insuficiente para: ${item.name}` };
        }
        product.stock -= item.quantity;
    }
    const newOrder: Order = { id: nextOrderId++, ...orderData, createdAt: new Date() };
    localOrders.unshift(newOrder);
    return { orderId: newOrder.id };
}

export async function updateOrderStatus(orderId: number, status: OrderStatus, paymentId?: string): Promise<void> {
    const order = localOrders.find(o => o.id === orderId);
    if (order) { order.status = status; if(paymentId) order.paymentId = paymentId; }
}

export async function restockItemsForOrder(orderId: number): Promise<void> {
    const order = localOrders.find(o => o.id === orderId);
    if (order && order.status !== 'paid' && order.status !== 'shipped') {
        for (const item of order.items) {
            const product = localProducts.find(p => p.id === item.productId);
            if (product) product.stock += item.quantity;
        }
    }
}

export async function getOrderById(id: number): Promise<Order | undefined> {
    if (localOrders.length === 0) await getOrders();
    const order = localOrders.find(o => o.id === id);
    return order ? JSON.parse(JSON.stringify(order)) : undefined;
}

export async function getOrders(): Promise<Order[]> {
    if (localOrders.length === 0) {
        const p1 = await getProductById(1), p4 = await getProductById(4), p3 = await getProductById(3);
        if (p1 && p4 && p3) {
             localOrders = [
                { id: 1, customerName: "Juan Pérez", customerEmail: "juan.perez@example.com", total: 67500, status: 'paid', createdAt: new Date('2024-07-20T10:30:00Z'), items: [{ productId: 1, name: p1.name, image: p1.images[0], quantity: 1, priceAtPurchase: 67500, originalPrice: 75000 }], paymentId: '123456789', deliveryMethod: 'shipping', shippingAddress: 'Av. Corrientes 123', shippingCity: 'CABA', shippingPostalCode: '1043' },
                { id: 2, customerName: "Maria García", customerEmail: "maria.garcia@example.com", total: 38250, status: 'shipped', createdAt: new Date('2024-07-19T15:00:00Z'), items: [{ productId: 4, name: p4.name, image: p4.images[0], quantity: 1, priceAtPurchase: 38250, originalPrice: 45000 }], paymentId: '987654321', deliveryMethod: 'pickup', pickupName: 'Maria García', pickupDni: '12345678' },
                { id: 3, customerName: "Carlos López", customerEmail: "carlos.lopez@example.com", total: 120000, status: 'pending_payment', createdAt: new Date('2024-07-21T09:00:00Z'), items: [{ productId: 3, name: p3.name, image: p3.images[0], quantity: 1, priceAtPurchase: 120000, originalPrice: null }], deliveryMethod: 'shipping', shippingAddress: 'Av. de Mayo 567', shippingCity: 'CABA', shippingPostalCode: '1084' },
             ];
             nextOrderId = 4;
        }
    }
    return JSON.parse(JSON.stringify(localOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())));
}
 // --- NUEVAS FUNCIONES PARA MANIPULAR PRODUCTOS ---

export async function createProduct(productData: Omit<Product, 'id' | 'salePrice'>): Promise<Product> {
    const newProduct: Product = {
        id: nextProductId++,
        ...productData,
        salePrice: null 
    };
    newProduct.salePrice = _calculateSalePrice(newProduct);
    localProducts.push(newProduct);
    return JSON.parse(JSON.stringify(newProduct));
}

export async function updateProduct(id: number, productData: Partial<Omit<Product, 'id' | 'salePrice'>>): Promise<Product> {
    const productIndex = localProducts.findIndex(p => p.id === id);
    if (productIndex === -1) {
        throw new Error('Producto no encontrado para actualizar');
    }
    const updatedProduct = {
        ...localProducts[productIndex],
        ...productData
    };
    updatedProduct.salePrice = _calculateSalePrice(updatedProduct);
    localProducts[productIndex] = updatedProduct;
    return JSON.parse(JSON.stringify(updatedProduct));
}

export async function deleteProduct(id: number): Promise<void> {
    const productIndex = localProducts.findIndex(p => p.id === id);
    if (productIndex !== -1) {
        localProducts.splice(productIndex, 1);
    }
}
    

