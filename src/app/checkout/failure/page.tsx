'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw, Loader2 } from 'lucide-react';

function CheckoutFailureClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionStatus = searchParams.get('collection_status');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    // Si venimos de un fallo de pago, guardamos el ID de la orden para que 
    // el CartContext pueda intentar restaurar el carrito en la próxima visita.
    if (orderId) {
      localStorage.setItem('pendingOrderId', orderId);
    }
  }, [orderId]);

  const getFailureReason = () => {
    switch (collectionStatus) {
      case 'rejected_by_bank':
        return 'Tu banco ha rechazado el pago.';
      case 'rejected_insufficient_amount':
        return 'No tienes fondos suficientes en tu cuenta.';
      case 'rejected_card_error':
        return 'Hubo un error con tu tarjeta. Por favor, verifica los datos.';
      case 'rejected_other_reason':
      default:
        return 'El pago fue rechazado. Tu carrito ha sido restaurado para que puedas intentar con otro método de pago.';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Pago Rechazado</CardTitle>
          <p className="text-muted-foreground">{getFailureReason()}</p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle>¿Qué puedes hacer?</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className='text-muted-foreground'>No te preocupes, ¡tus productos te esperan en el carrito!</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Verifica que los datos de tu método de pago sean correctos.</li>
            <li>Intenta la compra nuevamente desde el carrito.</li>
            <li>Prueba con un método de pago alternativo.</li>
          </ul>
        </CardContent>
      </Card>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={() => router.push('/cart')}><RefreshCw className="mr-2 h-4 w-4" />Ir al Carrito</Button>
        <Button variant="outline" onClick={() => router.push('/')}><Home className="mr-2 h-4 w-4" />Ir al Inicio</Button>
      </div>
    </div>
  );
}

export default function CheckoutFailurePage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    }>
      <CheckoutFailureClient />
    </Suspense>
  );
}
