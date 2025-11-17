'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Home, Package, Loader2 } from 'lucide-react';

// This is now a "dumb" component. All logic for cart synchronization
// is handled centrally by CartContext.
function CheckoutPendingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="h-16 w-16 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Pago Pendiente</CardTitle>
          <p className="text-muted-foreground">Tu pago está siendo procesado. No necesitas hacer nada más.</p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle>¿Qué significa esto?</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground">A veces, los pagos no se aprueban instantáneamente (especialmente en efectivo). Te enviaremos un email de confirmación cuando se apruebe.</p>
          <p className="text-muted-foreground">Mientras tanto, tu orden ha sido registrada. Puedes cerrar esta ventana de forma segura.</p>
        </CardContent>
      </Card>

       {paymentId && (
        <Card>
            <CardHeader><CardTitle>Detalles de la Transacción</CardTitle></CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">ID de Pago: <span className="font-mono">{paymentId}</span></p>
                {externalReference && <p className="text-sm text-muted-foreground mt-1">Referencia de Orden: <span className="font-mono">{externalReference}</span></p>}
            </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={() => router.push('/tienda')}><Package className="mr-2 h-4 w-4" />Volver a la Tienda</Button>
        <Button variant="outline" onClick={() => router.push('/')}><Home className="mr-2 h-4 w-4" />Ir al Inicio</Button>
      </div>
    </div>
  );
}

// The Suspense fallback is kept for a consistent user experience during page load.
export default function CheckoutPendingPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    }>
      <CheckoutPendingClient />
    </Suspense>
  );
}
