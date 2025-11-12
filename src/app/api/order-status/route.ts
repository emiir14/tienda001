
import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/data';

// --- DEBUGGING --- 
const log = (message: string, data?: any) => {
  console.log(`[API /api/order-status] ==> ${message}`, data !== undefined ? data : '');
}
// --- END DEBUGGING ---

export async function POST(request: Request) {
  log('Request received.');
  try {
    const { orderId } = await request.json();
    log('Parsed request body:', { orderId });

    if (!orderId) {
      log('Aborting: Order ID is missing.');
      return NextResponse.json({ error: 'Order ID es requerido' }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    log('Fetched order from database:', order);

    if (!order) {
      log('Aborting: Order not found in database.');
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // The client needs the status and, potentially, the items to restore the cart.
    // **FIX**: The correct property name is `items`, not `cartItems`.
    const responsePayload = {
      status: order.status,
      restorableCartItems: order.items 
    };

    log('Sending response to client:', responsePayload);
    return NextResponse.json(responsePayload);

  } catch (error) {
    // Use a more specific log for errors
    console.error('[API_ORDER_STATUS_ERROR]', { 
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
