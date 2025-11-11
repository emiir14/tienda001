
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { CartItem } from '@/lib/types';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export async function POST(request: NextRequest) {
    try {
        const { items, customer, orderId } = await request.json();

        if (!items || !customer || !orderId) {
            return NextResponse.json({ error: 'Missing required data: items, customer, or orderId' }, { status: 400 });
        }
        
        if (!SITE_URL) {
            console.error('[CREATE-PREFERENCE] CRITICAL: NEXT_PUBLIC_SITE_URL is not configured!');
            throw new Error('La variable de entorno NEXT_PUBLIC_SITE_URL no está configurada.');
        }

        const preferenceBody = {
            items: items.map((item: CartItem) => ({
                id: item.product.id.toString(),
                title: item.product.name,
                quantity: item.quantity,
                unit_price: item.product.price,
            })),
            payer: {
                name: customer.name,
                email: customer.email,
            },
            payment_methods: {
                excluded_payment_types: [],
                installments: 6, 
            },
            back_urls: {
                success: `${SITE_URL}/checkout/success`,
                failure: `${SITE_URL}/checkout/failure`,
                pending: `${SITE_URL}/checkout/pending`,
            },
            external_reference: orderId.toString(),
            notification_url: `${SITE_URL}/api/mercadopago-webhook-test`,
        };

        // *** DIAGNOSTIC LOGGING ***
        console.log('[CREATE-PREFERENCE] Sending the following body to Mercado Pago:', JSON.stringify(preferenceBody, null, 2));

        const preference = new Preference(client);
        const result = await preference.create({ body: preferenceBody });

        console.log('[CREATE-PREFERENCE] Successfully created preference. Init point: ', result.init_point);

        return NextResponse.json({ id: result.id, init_point: result.init_point });

    } catch (error: any) {
        // *** DIAGNOSTIC LOGGING ***
        console.error("[CREATE-PREFERENCE] CRITICAL ERROR:", {
            message: error.message,
            statusCode: error.statusCode,
            cause: error.cause,
            stack: error.stack
        });
        const errorMessage = error.cause?.message || error.message || 'Failed to create preference';
        const status = error.statusCode || 500;
        return NextResponse.json({ error: errorMessage }, { status });
    }
}
