
import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus, deductStockForOrder, getOrderById } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

export async function POST(request: NextRequest) {
  try {
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Payment system not configured' }, 
        { status: 500 }
      );
    }

    const body = await request.json();
    // The client will send the paymentId
    const { paymentId } = body;

    console.log('Fetching payment status for:', { paymentId });

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' }, 
        { status: 400 }
      );
    }

    // Fetch payment details from MercadoPago API
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching payment ${paymentId}:`, response.status, errorText);
      return NextResponse.json(
        { error: 'Error fetching payment details' }, 
        { status: response.status }
      );
    }

    const paymentData = await response.json();
    
    console.log('Payment details retrieved:', {
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference
    });

    // --- BUSINESS LOGIC ADDED ---
    if (!paymentData.external_reference) {
        console.warn(`Payment ${paymentId} is missing an external_reference. Cannot process order logic.`);
        // Still return the data to the client, as the primary function of this endpoint is to provide status
        return NextResponse.json(paymentData);
    }

    const orderId = parseInt(paymentData.external_reference, 10);
    const order = await getOrderById(orderId);

    if (!order) {
        console.error(`Order with ID ${orderId} not found. Cannot process.`);
        return NextResponse.json(paymentData);
    }

    // Idempotency check: Prevent re-processing if the webhook already handled it.
    if (order.status === 'paid' || order.status === 'delivered' || order.status === 'shipped') {
        console.log(`Order ${orderId} has already been processed with status: "${order.status}". No action needed.`);
        return NextResponse.json(paymentData);
    }

    let newStatus: OrderStatus;

    switch (paymentData.status) {
      case 'approved':
        newStatus = 'paid';
        console.log(`Payment ${paymentId} approved for order ${orderId}. Updating status and deducting stock.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        await deductStockForOrder(orderId);
        break;
        
      case 'in_process':
      case 'pending':
        newStatus = 'pending';
        console.log(`Payment ${paymentId} is pending for order ${orderId}. Updating status.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        break;
        
      case 'rejected':
        newStatus = 'failed';
        console.log(`Payment ${paymentId} rejected for order ${orderId}. Updating status.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        break;
        
      case 'cancelled':
        newStatus = 'cancelled';
        console.log(`Payment ${paymentId} cancelled for order ${orderId}. Updating status.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        break;
        
      default:
        console.log(`Ignoring unhandled payment status '${paymentData.status}' for payment ${paymentId}.`);
    }
    // --- END OF BUSINESS LOGIC ---

    // Return the full payment data to the client, which might need it for the UI.
    return NextResponse.json(paymentData);

  } catch (error: any) {
    console.error('❌ Error in payment-status endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
