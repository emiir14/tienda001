
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { CartItem } from '@/lib/types';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

// Ensure this environment variable in Vercel does NOT have a trailing slash.
// CORRECT Example: https://my-site.vercel.app
// INCORRECT Example: https://my-site.vercel.app/
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export async function POST(request: NextRequest) {
    try {
        const { items, customer, orderId } = await request.json();

        if (!items || !customer || !orderId) {
            return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
        }

        if (!SITE_URL) {
            console.error('[CREATE-PREFERENCE] CRITICAL: NEXT_PUBLIC_SITE_URL is not configured!');
            throw new Error('NEXT_PUBLIC_SITE_URL is not configured.');
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
            // FINAL FIX: Pointing to the new, robust, and correct webhook URL.
            notification_url: `${SITE_URL}/api/mercadopago-webhook`,
        };

        console.log('[CREATE-PREFERENCE] Final preference body being sent to Mercado Pago:', JSON.stringify(preferenceBody, null, 2));

        const preference = new Preference(client);
        const result = await preference.create({ body: preferenceBody });

        return NextResponse.json({ id: result.id, init_point: result.init_point });

    } catch (error: any) {
        console.error("[CREATE-PREFERENCE] Error:", error);
        const errorMessage = error.cause?.message || error.message || 'Failed to create preference';
        const status = error.statusCode || 500;
        return NextResponse.json({ error: errorMessage }, { status });
    }
}
