
import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID es requerido' }, { status: 400 });
    }

    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const responsePayload = {
      status: order.status,
      restorableCartItems: order.items 
    };

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('[API_ORDER_STATUS_ERROR]', { 
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
