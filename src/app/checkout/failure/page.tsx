'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, Package, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';

function CheckoutFailureClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  
  const collectionStatus = searchParams.get('collection_status');
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    const pid = searchParams.get('payment_id');
    if (pid) {
      fetchPaymentDetails(pid);
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchPaymentDetails = async (paymentId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });

      if (!response.ok) throw new Error('Failed to fetch payment status');

      const data = await response.json();

      if (data.restorableCartItems && Array.isArray(data.restorableCartItems)) {
        for (const item of data.restorableCartItems) {
          addToCart(item, item.quantity);
        }
        toast({
          title: "Carrito Restaurado",
          description: "El pago falló, pero hemos restaurado los productos en tu carrito para que puedas reintentarlo.",
        });
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast({
        title: "Error de Recuperación",
        description: "No se pudo verificar el pago, pero tu carrito debería estar restaurado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
        return 'El pago fue rechazado. Hemos restaurado tu carrito para que puedas intentar con otro método de pago.';
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Restaurando tu carrito...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Pago Rechazado
          </CardTitle>
          <p className="text-muted-foreground">
            {getFailureReason()}
          </p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ¿Qué puedes hacer?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className='text-muted-foreground'>No te preocupes, ¡tus productos siguen en el carrito!</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Verifica que los datos de tu tarjeta o método de pago sean correctos.</li>
            <li>Intenta realizar la compra nuevamente desde el carrito.</li>
            <li>Prueba con un método de pago alternativo.</li>
          </ul>
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
        <Button onClick={() => router.push('/cart')} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Ir al Carrito e Intentar de Nuevo
        </Button>
        <Button variant="outline" onClick={() => router.push('/')} className="flex items-center gap-2">
          <Home className="h-4 w-4" /> Ir al Inicio
        </Button>
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
