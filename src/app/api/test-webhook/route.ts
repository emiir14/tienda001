
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Convertir los Headers a un objeto simple para poder loguearlos
    const headersObj: { [key: string]: string } = {};
    request.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    console.log('[TEST-WEBHOOK] ¡Notificación RECIBIDA!');
    console.log('[TEST-WEBHOOK] Body:', JSON.stringify(body, null, 2));
    console.log('[TEST-WEBHOOK] Headers:', JSON.stringify(headersObj, null, 2));
    
    // Respondemos a Mercado Pago que todo está bien para que no reintente.
    return NextResponse.json({ status: 'received' });

  } catch (error: any) {
    console.error('[TEST-WEBHOOK] Error al procesar la notificación:', error.message);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
