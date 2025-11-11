
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
    const { paymentId } = body;

    console.log('Fetching payment status for:', { paymentId });

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' }, 
        { status: 400 }
      );
    }

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

    if (!paymentData.external_reference) {
        console.warn(`Payment ${paymentId} is missing an external_reference. Cannot process order logic.`);
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

    // The function will now return from within the switch to allow for custom responses.
    switch (paymentData.status) {
      case 'approved':
        newStatus = 'paid';
        console.log(`Payment ${paymentId} approved for order ${orderId}. Updating status and deducting stock.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));
        await deductStockForOrder(orderId);
        // Return original data; no cart restoration needed.
        return NextResponse.json(paymentData);
        
      case 'in_process':
      case 'pending':
      case 'rejected':
      case 'cancelled':
        if (paymentData.status === 'in_process' || paymentData.status === 'pending') {
          newStatus = 'pending';
        } else if (paymentData.status === 'rejected') {
          newStatus = 'failed';
        } else { // 'cancelled'
          newStatus = 'cancelled';
        }
        
        console.log(`Payment ${paymentId} has status '${paymentData.status}' for order ${orderId}.`);
        await updateOrderStatus(orderId, newStatus, String(paymentId));

        // --- Start of Cart Restoration Logic ---
        let restorableCartItems = null;
        if (order && order.items) {
          console.log(`Preparing ${order.items.length} item(s) for cart restoration for order ${orderId}.`);
          restorableCartItems = order.items.map(item => ({
            ...item.product,
            quantity: item.quantity,
          }));
        } else {
          console.warn(`Could not find items for order ${orderId} to restore cart.`);
        }

        // Return payment data PLUS the items to restore.
        return NextResponse.json({
          ...paymentData,
          restorableCartItems,
        });
        // --- End of Cart Restoration Logic ---
        
      default:
        console.log(`Ignoring unhandled payment status '${paymentData.status}' for payment ${paymentId}.`);
        // For any other status, just return the data without modification.
        return NextResponse.json(paymentData);
    }

  } catch (error: any) {
    console.error('❌ Error in payment-status endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
