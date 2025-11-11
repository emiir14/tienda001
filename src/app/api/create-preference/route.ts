
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { CartItem } from '@/lib/types';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

// Asegúrate de que esta variable de entorno en Vercel NO tenga una barra al final.
// Ejemplo CORRECTO: https://mi-sitio.vercel.app
// Ejemplo INCORRECTO: https://mi-sitio.vercel.app/
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export async function POST(request: NextRequest) {
    try {
        const { items, customer, orderId } = await request.json();

        if (!items || !customer || !orderId) {
            return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
        }

        if (!SITE_URL) {
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
            // CORREGIDO: Apuntando al webhook de prueba y con la URL bien formada.
            notification_url: `${SITE_URL}/api/mercadopago-webhook-test`,
        };

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
