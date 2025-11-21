
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getOrderById, updateOrderStatus, deductStockForOrder } from '@/lib/data';

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN!,
    options: { timeout: 5000, idempotencyKey: 'abc' }
});

export async function POST(req: NextRequest) {
    try {
        console.log('---------------------------------------------------');
        console.log('Received request to /api/create-preference');

        const body = await req.json();
        console.log('Request Body:', JSON.stringify(body, null, 2));

        const { items, orderId, discountAmount, couponCode } = body;

        if (!items || !Array.isArray(items) || items.length === 0 || !orderId) {
            console.error('Validation Error: Missing required data (items, orderId)');
            return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
        }

        const preferenceItems = items.map(item => ({
            id: item.product.id.toString(),
            title: item.product.name,
            quantity: item.quantity,
            unit_price: Number(item.product.salePrice ?? item.product.price),
            currency_id: 'ARS', // <--- Dato crucial que probablemente faltaba
            description: item.product.description?.substring(0, 100) || ''
        }));
        
        console.log('Mapped Preference Items:', JSON.stringify(preferenceItems, null, 2));

        const preferenceData: any = {
            items: preferenceItems,
            external_reference: String(orderId),
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment-notification`,
                failure: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/failure?orderId=${orderId}`,
                pending: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment-notification`,
            },
            auto_return: 'approved',
            notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment-notification?source=ipn&orderId=${orderId}`,
            metadata: {
                orderId: orderId,
                couponCode: couponCode,
            },
        };
        
        // Aplicar descuento si existe
        if (discountAmount && discountAmount > 0) {
            preferenceData.items.push({
                id: 'DISCOUNT',
                title: couponCode ? `Descuento por cupón (${couponCode})` : 'Descuentos de producto',
                quantity: 1,
                unit_price: -Number(discountAmount),
                currency_id: 'ARS',
            });
        }

        console.log('Final Preference Payload:', JSON.stringify(preferenceData, null, 2));

        const preference = new Preference(client);
        const result = await preference.create({ body: preferenceData });

        console.log('Mercado Pago API Response:', result);

        return NextResponse.json({ init_point: result.init_point });

    } catch (error: any) {
        console.error('***************************************************');
        console.error('Error creating Mercado Pago preference:', error);
        if (error.cause) {
             console.error('Error Cause:', error.cause);
        }
        console.error('***************************************************');
        return NextResponse.json({ error: error.message || 'Failed to create preference' }, { status: 500 });
    }
}
