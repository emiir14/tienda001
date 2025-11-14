
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

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'shipped' | 'delivered' | 'refunded';

export type OrderData = {
    customerName: string;
    customerEmail: string;
    total: number;
    status: OrderStatus;
    items: CartItem[];
    couponCode?: string | null;
    discountAmount?: number;
    paymentId?: string | null;
    shippingAddress: string;
    shippingCity: string;
    shippingPostalCode: string;
}

export type Order = {
  id: number;
  customerName: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  items: CartItem[];
  couponCode?: string | null;
  discountAmount?: number;
  paymentId?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
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
