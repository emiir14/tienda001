

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createOrder } from '@/lib/data';
import type { CartItem } from '@/lib/types';


// This function initializes the MercadoPago SDK.
async function initializeMercadoPago() {
  const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    options: {
      timeout: 10000
    }
  });
  
  return new Preference(client);
}

// This function handles the POST request to create a payment preference.
export async function POST(request: NextRequest) {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';
  
  try {
    // 1. Validate environment variables first.
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      console.error('Missing required environment variables for payment processing.');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }
    
    // 2. Parse and validate the incoming request body.
    const body = await request.json();
    const { cartItems, shippingInfo, totalPrice, discount, appliedCoupon } = body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart items are required.' }, { status: 400 });
    }
    if (!shippingInfo?.email || !shippingInfo?.name) {
      return NextResponse.json({ error: 'Customer information is required.' }, { status: 400 });
    }

    // 3. Create a pending order in our database.
    const { orderId, error: orderError } = await createOrder({
      customerName: shippingInfo.name,
      customerEmail: shippingInfo.email,
      total: totalPrice,
      status: 'pending',
      items: cartItems,
      couponCode: appliedCoupon?.code,
      discountAmount: discount,
      shippingAddress: shippingInfo.address,
      shippingCity: shippingInfo.city,
      shippingPostalCode: shippingInfo.postalCode,
    });

    if (orderError || !orderId) {
      console.error('Failed to create initial order in DB:', orderError);
      return NextResponse.json({ error: orderError || 'Failed to create order.' }, { status: 500 });
    }

    console.log(`Created pending order with ID: ${orderId}`);

    // 4. Prepare the data for the MercadoPago preference.
    const preferenceItems = cartItems.map((item: CartItem) => {
      const price = item.product.salePrice ?? item.product.price;
      // Ensure unit_price has max 2 decimal places as a best practice.
      const roundedPrice = Math.round(price * 100) / 100;

      return {
        id: String(item.product.id),
        title: item.product.name,
        quantity: item.quantity,
        unit_price: roundedPrice,
        currency_id: "ARS",
        description: item.product.shortDescription || item.product.name,
      }
    });

    // Check if a discount is applied and add it as a negative item.
    if (discount > 0) {
        preferenceItems.push({
            id: appliedCoupon?.code || 'DISCOUNT',
            title: 'Descuento por Cupón',
            quantity: 1,
            unit_price: -Math.round(discount * 100) / 100, // The discount amount as a negative value
            currency_id: 'ARS',
            description: `Cupón aplicado: ${appliedCoupon?.code}`,
        });
    }

    const preferenceBody = {
      items: preferenceItems,
      payer: {
        name: shippingInfo.name,
        email: shippingInfo.email,
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: 6,
      },
      back_urls: {
        success: `${BASE_URL}/checkout/success`,
        failure: `${BASE_URL}/checkout/failure`, 
        pending: `${BASE_URL}/checkout/pending`
      },
      external_reference: String(orderId), 
      statement_descriptor: 'OSADIA',
      notification_url: `${BASE_URL}/api/mercadopago-webhook`,
    };

    // 5. Create the preference using the MercadoPago SDK.
    const preference = await initializeMercadoPago();
    const response = await preference.create({ body: preferenceBody });
    
    if (!response.id) {
      throw new Error('Failed to create payment preference - no ID returned from MercadoPago.');
    }
    
    console.log('Preference created successfully:', { id: response.id, init_point: response.init_point });

    // 6. Return the preference details to the client.
    return NextResponse.json({ 
        preferenceId: response.id,
        initPoint: response.init_point
    });

  } catch (error: any) {
    console.error('Error creating MercadoPago preference:', error);
    let errorMessage = 'Error creating payment preference';
    if (error?.cause) {
      console.error('MercadoPago API Error:', error.cause);
      errorMessage = error.cause.message || errorMessage;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
