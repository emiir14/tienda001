
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[TEST-WEBHOOK] INVOCADO! La petición SÍ llegó a Vercel.');
  
  const headers: { [key: string]: string } = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  console.log('[TEST-WEBHOOK] Headers:', JSON.stringify(headers, null, 2));

  try {
    const rawBody = await request.text();
    console.log('[TEST-WEBHOOK] Raw Body:', rawBody);
  } catch (e: any) {
    console.error('[TEST-WEBHOOK] Error leyendo el body:', e.message);
  }
  
  return NextResponse.json({ status: "received" });
}

export async function GET() {
    console.log('[TEST-WEBHOOK] Recibida petición GET de calentamiento.');
    return NextResponse.json({ status: "awake" });
}
