
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { CartItem } from '@/lib/types';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
// CORREGIDO: Usar la variable de entorno correcta que ya tienes configurada
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export async function POST(request: NextRequest) {
    try {
        const { items, customer, orderId } = await request.json();

        if (!items || !customer || !orderId) {
            return NextResponse.json({ error: 'Missing required data: items, customer, or orderId' }, { status: 400 });
        }
        
        if (!SITE_URL) {
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
                installments: 6, // Puedes configurar esto según tus necesidades
            },
            back_urls: {
                success: `${SITE_URL}/checkout/success`,
                failure: `${SITE_URL}/checkout/failure`,
                pending: `${SITE_URL}/checkout/pending`,
            },
            external_reference: orderId.toString(),
            notification_url: `${SITE_URL}/api/webhook/mercadopago`, // Apuntando al webhook real
        };

        const preference = new Preference(client);
        const result = await preference.create({ body: preferenceBody });

        return NextResponse.json({ id: result.id, init_point: result.init_point });

    } catch (error: any) {
        console.error("Error creating preference:", error);
        const errorMessage = error.cause?.message || error.message || 'Failed to create preference';
        const status = error.statusCode || 500;
        return NextResponse.json({ error: errorMessage }, { status });
    }
}
