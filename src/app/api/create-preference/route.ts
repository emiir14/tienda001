
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN!,
    options: { timeout: 5000, idempotencyKey: 'abc' }
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { items, orderId, discountAmount, couponCode } = body;

        if (!items || !Array.isArray(items) || items.length === 0 || !orderId) {
            return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
        }

        const requestUrl = new URL(req.url);
        const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

        const preferenceItems = items.map(item => ({
            id: item.product.id.toString(),
            title: item.product.name,
            quantity: item.quantity,
            unit_price: Number(item.product.salePrice ?? item.product.price),
            currency_id: 'ARS',
            description: item.product.description?.substring(0, 100) || ''
        }));
        
        // --- CORRECCIÓN: Se elimina el tipo explícito para evitar el error de importación ---
        const payment_methods = {
            installments: 6 // Limita el número máximo de cuotas a 6
        };
        
        const preferenceData: any = {
            items: preferenceItems,
            payment_methods: payment_methods, // Se añade la configuración de cuotas
            external_reference: String(orderId),
            back_urls: {
                success: `${baseUrl}/checkout/success?orderId=${orderId}`,
                failure: `${baseUrl}/checkout/failure?orderId=${orderId}`,
                pending: `${baseUrl}/checkout/success?orderId=${orderId}&status=pending`,
            },
            auto_return: 'approved',
            notification_url: `${baseUrl}/api/mercadopago-webhook`,
            metadata: {
                orderId: orderId,
                couponCode: couponCode,
            },
        };
        
        if (discountAmount && discountAmount > 0) {
            preferenceData.items.push({
                id: 'DISCOUNT',
                title: couponCode ? `Descuento por cupón (${couponCode})` : 'Descuentos de producto',
                quantity: 1,
                unit_price: -Number(discountAmount),
                currency_id: 'ARS',
            });
        }

        const preference = new Preference(client);
        const result = await preference.create({ body: preferenceData });

        return NextResponse.json({ init_point: result.init_point });

    } catch (error: any) {
        console.error('Error creating Mercado Pago preference:', error);
        if (error.cause) {
             console.error('Error Cause:', error.cause);
        }
        return NextResponse.json({ error: error.message || 'Failed to create preference' }, { status: 500 });
    }
}
