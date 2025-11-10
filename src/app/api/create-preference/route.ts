
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { CartItem } from '@/lib/types';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export async function POST(request: NextRequest) {
    try {
        const { items, customer, orderId } = await request.json();

        if (!items || !customer || !orderId) {
            return NextResponse.json({ error: 'Missing required data: items, customer, or orderId' }, { status: 400 });
        }

        const preferenceBody = {
            items: items.map((item: CartItem) => ({
                id: item.product.id.toString(), // CORREGIDO
                title: item.product.name,       // CORREGIDO
                quantity: item.quantity,            // Esto estaba bien
                unit_price: item.product.price,     // CORREGIDO
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
                success: `${BASE_URL}/checkout/success`,
                failure: `${BASE_URL}/checkout/failure`,
                pending: `${BASE_URL}/checkout/pending`,
            },
            external_reference: orderId.toString(),
            notification_url: `${BASE_URL}/api/test-webhook`, // APUNTANDO AL NUEVO ENDPOINT
        };

        const preference = new Preference(client);
        const result = await preference.create({ body: preferenceBody });

        return NextResponse.json({ id: result.id });

    } catch (error: any) {
        console.error("Error creating preference:", error);
        return NextResponse.json({ error: `Failed to create preference: ${error.message}` }, { status: 500 });
    }
}
