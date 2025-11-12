'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, Package, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';

function CheckoutFailureClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addToCart, clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    localStorage.removeItem('pendingOrderId');

    if (paymentId) {
      fetchPaymentDetails(paymentId);
    } else {
      setLoading(false);
      // If there's no payment ID, we assume it's a simple failure.
      setPaymentStatus(searchParams.get('collection_status') || 'rejected_other_reason');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const fetchPaymentDetails = async (pId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: pId })
      });

      if (!response.ok) throw new Error('Failed to fetch payment status');

      const data = await response.json();
      setPaymentStatus(data.status);

      // CRITICAL: Race condition fix. Only restore cart if the final status is NOT approved.
      if (data.status !== 'approved') {
        if (data.restorableCartItems && Array.isArray(data.restorableCartItems)) {
          // Clear any existing items before restoring to prevent duplicates.
          clearCart(); 
          for (const item of data.restorableCartItems) {
            addToCart(item.product, item.quantity);
          }
          toast({
            title: "Carrito Restaurado",
            description: "El pago falló, pero hemos restaurado los productos en tu carrito para que puedas reintentarlo.",
          });
        }
      } else {
        // If by any chance the payment was approved, ensure the cart is cleared.
        clearCart();
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast({
        title: "Error de Recuperación",
        description: "No se pudo verificar el estado final del pago.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFailureReason = (status: string | null) => {
    switch (status) {
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
        <p className="text-muted-foreground">Verificando estado final y restaurando tu carrito...</p>
      </div>
    );
  }

  // This handles the rare case where the user lands on failure but the payment was actually approved.
  if (paymentStatus === 'approved') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">¡Pago Aprobado!</CardTitle>
            <p className="text-muted-foreground">Aunque llegaste a esta página, confirmamos que tu pago fue exitoso. ¡Gracias por tu compra!</p>
          </CardHeader>
        </Card>
         <div className="flex justify-center">
          <Button onClick={() => router.push('/tienda')}>Ir a la Tienda</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Pago Rechazado</CardTitle>
          <p className="text-muted-foreground">{getFailureReason(paymentStatus)}</p>
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
