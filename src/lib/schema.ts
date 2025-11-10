import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  primaryKey,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ############################################################################
// PRODUCTS
// ############################################################################
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  shortDescription: text('short_description'),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  discountPercentage: integer('discount_percentage').default(0),
  offerStartDate: timestamp('offer_start_date'),
  offerEndDate: timestamp('offer_end_date'),
  stock: integer('stock').notNull().default(0),
  images: jsonb('images').default('[]').$type<string[]>(),
  aiHint: text('ai_hint'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ many }) => ({
  productCategories: many(productCategories),
}));

// ############################################################################
// CATEGORIES
// ############################################################################
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  parentId: integer('parent_id').references(() => categories.id), // For subcategories
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parent_category',
  }),
  children: many(categories, {
    relationName: 'parent_category',
  }),
  productCategories: many(productCategories),
}));

// ############################################################################
// PRODUCT <-> CATEGORIES (Many-to-Many Junction Table)
// ############################################################################
export const productCategories = pgTable(
  'product_categories',
  {
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.productId, t.categoryId] }),
  })
);

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, {
    fields: [productCategories.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id],
  }),
}));


// ############################################################################
// COUPONS
// ############################################################################
export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  discountType: varchar('discount_type', { enum: ['percentage', 'fixed'] }).notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  expiryDate: timestamp('expiry_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


// ############################################################################
// ORDERS
// ############################################################################
export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    customerEmail: varchar('customer_email', { length: 255 }).notNull(),
    shippingAddress: text('shipping_address').notNull(),
    shippingCity: varchar('shipping_city', { length: 100 }).notNull(),
    shippingPostalCode: varchar('shipping_postal_code', { length: 20 }).notNull(),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', {
        enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded']
    }).notNull().default('pending'),
    paymentId: varchar('payment_id', { length: 255 }),
    couponCode: varchar('coupon_code', { length: 50 }),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ many }) => ({
    items: many(orderItems),
}));

// ############################################################################
// ORDER ITEMS (Products within an Order)
// ############################################################################
export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'set null' }), // Set null if product is deleted
    quantity: integer('quantity').notNull(),
    priceAtPurchase: decimal('price_at_purchase', { precision: 10, scale: 2 }).notNull(), // Price of the product when the order was made
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
}));
