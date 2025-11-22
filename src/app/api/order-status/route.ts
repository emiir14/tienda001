'use client';

import { NextResponse } from 'next/server';
import { getOrderById, getProductById } from '@/lib/data'; // Importamos getProductById
import { OrderItem } from '@/lib/types';

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

    // Transformamos los items de la orden al formato que espera CartContext
    // CartContext espera un array de { product: Product, quantity: number }
    const restorableCartItems = await Promise.all(
      (order.items as OrderItem[]).map(async (item) => {
        // Obtenemos los detalles completos del producto para asegurarnos
        // de que tenemos toda la información (imágenes, precio actual, etc.)
        const productDetails = await getProductById(item.productId);

        if (!productDetails) {
          // Si un producto ya no existe, no lo podemos restaurar.
          return null;
        }

        return {
          product: productDetails, // El objeto 'product' que espera el frontend
          quantity: item.quantity,
        };
      })
    );
    
    // Filtramos cualquier item nulo (productos no encontrados)
    const validItems = restorableCartItems.filter(item => item !== null);

    const responsePayload = {
      status: order.status,
      restorableCartItems: validItems, // Enviamos los items en el formato correcto
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
