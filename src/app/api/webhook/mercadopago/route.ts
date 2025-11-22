'use server';

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { getOrderById, updateOrderStatus, createOrderFromWebhook, deductStockForOrder } from '@/lib/data';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

// Esta es la función que se ejecuta cuando MercadoPago nos envía una notificación.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    // Verificamos si la notificación es sobre una actualización de pago.
    if (action === 'payment.updated') {
      const payment = await new Payment(client).get({ id: data.id });
      
      if(payment && payment.external_reference && payment.status === 'approved') {
        const orderId = parseInt(payment.external_reference, 10);

        // 1. Buscamos la orden en nuestra base de datos.
        const order = await getOrderById(orderId);

        if (order) {
          // 2. Si la orden ya está pagada, no hacemos nada para evitar duplicados.
          if (order.status === 'paid' || order.status === 'delivered') {
            return NextResponse.json({ status: 'OK', message: 'Order was already processed.' });
          }
          
          // 3. ACTUALIZACIÓN IMPORTANTE:
          // Solo descontamos stock aquí si la orden es un PAGO WEB (deliveryMethod: 'shipping')
          if (order.deliveryMethod === 'shipping') {
            console.log(`Webhook: Payment approved for web order ${orderId}. Deducting stock.`);
            await deductStockForOrder(orderId); // Descontamos el stock.
          }

          // 4. Actualizamos el estado de la orden a 'pagado'.
          await updateOrderStatus(orderId, 'paid', String(data.id));
          console.log(`Webhook: Order ${orderId} status updated to paid.`);
        
        } else {
          // Si la orden no se creó inicialmente (raro), el webhook puede crearla.
          console.log(`Webhook: Order ${orderId} not found. Creating from webhook.`);
          const { newOrder } = await createOrderFromWebhook(payment);
          if(newOrder && newOrder.deliveryMethod === 'shipping') {
             await deductStockForOrder(newOrder.id); // También descontamos stock aquí.
          }
        }
      }
    }
    return NextResponse.json({ status: 'OK' });
  } catch (error: any) { 
    console.error('[MP_WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
