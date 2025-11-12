
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

    return NextResponse.json({ status: order.status });

  } catch (error) {
    console.error('[API_ORDER_STATUS_ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

