
// --- DEFINICIÓN DE NUEVA ESTRUCTURA --- //

export type OrderItem = {
  productId: number;
  name: string;
  image: string; // Guardamos solo la URL de la imagen principal
  quantity: number;
  priceAtPurchase: number; // El precio que el cliente pagó por unidad (puede ser el de oferta)
  originalPrice: number | null; // El precio original si había una oferta, para el tachado
};

export type Category = {
  id: number;
  name: string;
  parentId?: number | null;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number | null;
  images: string[];
  categoryIds: number[];
  stock: number;
  sku?: string;
  aiHint?: string;
  featured?: boolean;
  discountPercentage?: number | null;
  offerStartDate?: Date | null;
  offerEndDate?: Date | null;
  createdAt?: Date;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Coupon = {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiryDate: Date | null;
  isActive: boolean;
  minPurchaseAmount?: number | null;
};

export type DeliveryMethod = 'shipping' | 'pickup' | 'pay_in_store';

export type PaymentType = 'Pago Online' | 'Pago en Local';

export type OrderStatus = 'pending_payment' | 'awaiting_payment_in_store' | 'paid' | 'failed' | 'cancelled' | 'shipped' | 'delivered' | 'refunded';

// --- ACTUALIZACIÓN DE TIPOS DE ORDEN ---
// Ahora usan OrderItem[] en lugar de CartItem[]

export type OrderData = {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    total: number;
    status: OrderStatus;
    items: OrderItem[]; // <-- ACTUALIZADO
    couponCode?: string | null;
    discountAmount?: number;
    paymentId?: string | null;
    deliveryMethod: DeliveryMethod;
    paymentType: PaymentType;
    pickupName?: string | null;
    pickupDni?: string | null;
    shippingAddress?: string | null;
    shippingCity?: string | null;
    shippingPostalCode?: string | null;
}

export type Order = {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  items: OrderItem[]; // <-- ACTUALIZADO
  couponCode?: string | null;
  discountAmount?: number;
  paymentId?: string | null;
  deliveryMethod: DeliveryMethod;
  paymentType: PaymentType;
  pickupName?: string | null;
  pickupDni?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingPostalCode?: string | null;
};


export type SalesMetrics = {
    totalRevenue: number;
    totalSales: number;
    topSellingProducts: {
        productId: number;
        name: string;
        count: number;
    }[];
};

export type Subscriber = {
  id: number;
  email: string;
  created_at: Date;
};
