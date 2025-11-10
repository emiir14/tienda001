
import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus, deductStockForOrder, getOrderByPaymentId, getOrderById } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';

// ESTE ES UN ENDPOINT DE DEPURACIÓN Y PRUEBAS.
// Te permite simular manualmente la lógica del webhook.
// Para usarlo, envía una petición POST a /api/manual-trigger con un JSON como:
// { "paymentId": "ID_DEL_PAGO_REAL", "status": "approved" }
// o
// { "paymentId": "ID_DEL_PAGO_REAL", "status": "rejected" }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, status: simulatedStatus } = body;

    if (!paymentId || !simulatedStatus || typeof simulatedStatus !== 'string') {
      return NextResponse.json({ error: 'Se requiere "paymentId" y "status" (string) en el cuerpo de la petición.' }, { status: 400 });
    }
    
    console.log(`[MANUAL-TRIGGER] Iniciando disparo manual para Payment ID: ${paymentId} con estado simulado: ${simulatedStatus}`);

    let order = await getOrderByPaymentId(String(paymentId));
    
    if (!order) {
        console.log(`[MANUAL-TRIGGER] Orden no encontrada por payment_id. Buscando por ID de orden en MercadoPago...`);
        try {
            const { MercadoPagoConfig, Payment } = await import('mercadopago');
            const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: paymentId });
            
            if (paymentData.external_reference) {
                const orderIdFromRef = parseInt(paymentData.external_reference, 10);
                if (!isNaN(orderIdFromRef)) {
                    order = await getOrderById(orderIdFromRef);
                    console.log(`[MANUAL-TRIGGER] Orden encontrada por fallback con ID: ${orderIdFromRef}`);
                }
            }
        } catch (mpError) {
            console.error('[MANUAL-TRIGGER] Error al consultar a MercadoPago para el fallback:', mpError);
        }
    }

    if (!order) {
      console.error(`[MANUAL-TRIGGER] CRÍTICO: No se pudo encontrar la orden asociada al Payment ID ${paymentId}.`);
      return NextResponse.json({ error: `Orden no encontrada para el paymentId ${paymentId}` }, { status: 404 });
    }

    const orderId = order.id;
    console.log(`[MANUAL-TRIGGER] Orden encontrada con ID: ${orderId}. Estado actual: "${order.status}".`);

    // --- INICIO DE LA CORRECCIÓN ---
    let finalStatus: OrderStatus | null = null;

    switch (simulatedStatus) {
      case 'approved':
        finalStatus = 'paid';
        console.log(`[MANUAL-TRIGGER] El estado simulado es 'approved'. Actualizando orden a 'paid'.`);
        await updateOrderStatus(orderId, finalStatus, String(paymentId));
        console.log(`[MANUAL-TRIGGER] Descontando stock para la orden ${orderId}.`);
        await deductStockForOrder(orderId);
        console.log(`[MANUAL-TRIGGER] ¡Stock descontado! Proceso completado.`);
        break;
      
      case 'rejected':
        finalStatus = 'failed';
        console.log(`[MANUAL-TRIGGER] El estado simulado es 'rejected'. Actualizando orden a 'failed'.`);
        await updateOrderStatus(orderId, finalStatus, String(paymentId));
        console.log(`[MANUAL-TRIGGER] Proceso completado.`);
        break;
      
      case 'cancelled':
        finalStatus = 'cancelled';
        console.log(`[MANUAL-TRIGGER] El estado simulado es 'cancelled'. Actualizando orden a 'cancelled'.`);
        await updateOrderStatus(orderId, finalStatus, String(paymentId));
        console.log(`[MANUAL-TRIGGER] Proceso completado.`);
        break;

      // También permite simular con nuestros propios estados internos
      case 'paid':
      case 'failed':
        finalStatus = simulatedStatus;
        await updateOrderStatus(orderId, finalStatus, String(paymentId));
        if (finalStatus === 'paid') {
          await deductStockForOrder(orderId);
        }
        console.log(`[MANUAL-TRIGGER] Proceso para estado interno '${finalStatus}' completado.`);
        break;

      default:
        console.log(`[MANUAL-TRIGGER] Estado simulado no manejado: '${simulatedStatus}'.`);
        return NextResponse.json({ message: `Estado simulado no manejado: ${simulatedStatus}` });
    }
    // --- FIN DE LA CORRECCIÓN ---

    return NextResponse.json({ success: true, orderId: orderId, newStatus: finalStatus });

  } catch (error) {
    console.error('[MANUAL-TRIGGER] CRITICAL ERROR:', error);
    return NextResponse.json({ error: 'Error en el disparo manual.' }, { status: 500 });
  }
}
