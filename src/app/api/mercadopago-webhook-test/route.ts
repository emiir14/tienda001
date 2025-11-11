
// src/app/api/mercadopago-webhook-test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[TEST-WEBHOOK] ✅ FUNCTION STARTED - No data.ts imports');
  
  try {
    const body = await request.json();
    console.log('[TEST-WEBHOOK] Body received:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test webhook works without data.ts imports',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[TEST-WEBHOOK] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
