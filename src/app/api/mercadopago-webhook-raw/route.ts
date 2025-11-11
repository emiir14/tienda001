// src/app/api/mercadopago-webhook-raw/route.ts

// FORZAR Node.js runtime (NO Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Si tienes Pro plan

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Log ANTES de cualquier operación
  const startTime = Date.now();
  console.log('🔵 [WEBHOOK-RAW] ========== FUNCTION INVOKED ==========');
  console.log('🔵 [WEBHOOK-RAW] Timestamp:', new Date().toISOString());
  console.log('🔵 [WEBHOOK-RAW] Request method:', request.method);
  console.log('🔵 [WEBHOOK-RAW] Request URL:', request.url);
  
  try {
    // Log headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('🔵 [WEBHOOK-RAW] Headers:', JSON.stringify(headers, null, 2));
    
    // Intentar leer el body de múltiples formas
    let bodyText = '';
    let bodySize = 0;
    
    try {
      bodyText = await request.text();
      bodySize = Buffer.byteLength(bodyText, 'utf8');
      console.log('🔵 [WEBHOOK-RAW] Body size:', bodySize, 'bytes');
      console.log('🔵 [WEBHOOK-RAW] Body preview (first 500 chars):', bodyText.substring(0, 500));
    } catch (bodyError: any) {
      console.error('🔴 [WEBHOOK-RAW] Error reading body:', bodyError.message);
    }
    
    const endTime = Date.now();
    console.log('🔵 [WEBHOOK-RAW] Processing time:', endTime - startTime, 'ms');
    console.log('🔵 [WEBHOOK-RAW] ========== RESPONDING OK ==========');
    
    return NextResponse.json({ 
      success: true,
      received: true,
      timestamp: new Date().toISOString(),
      bodySize,
      processingTime: endTime - startTime
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('🔴 [WEBHOOK-RAW] CRITICAL ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    // IMPORTANTE: Devolver 200 para evitar reintentos
    return NextResponse.json({ 
      error: true,
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  }
}

// También captura GET para debugging
export async function GET() {
  console.log('🔵 [WEBHOOK-RAW] GET request received - endpoint is alive');
  return NextResponse.json({ 
    status: 'Webhook endpoint is active',
    timestamp: new Date().toISOString(),
    runtime: 'nodejs'
  });
}