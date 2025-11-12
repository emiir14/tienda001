'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Home, Package, Loader2, CheckCircle } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';

function CheckoutPendingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [externalReference, setExternalReference] = useState<string | null>(null);

  useEffect(() => {
    localStorage.removeItem('pendingOrderId');

    const pid = searchParams.get('payment_id');
    const ref = searchParams.get('external_reference');
    setPaymentId(pid);
    setExternalReference(ref);

    if (pid) {
      fetchPaymentDetails(pid);
    } else {
      // If no payment ID, we assume it's a standard pending state (e.g., cash payment)
      setPaymentStatus('pending');
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchPaymentDetails = async (pId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: pId })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment status');
      }

      const data = await response.json();
      setPaymentStatus(data.status);

      // CRITICAL: Race condition fix.
      // If the webhook was faster and the payment is now approved, clear the cart.
      if (data.status === 'approved') {
        clearCart();
      }
      // No need to restore the cart on pending, as the user did not intend to abandon it.

    } catch (error) {
      console.error('Error fetching payment details:', error);
      // Fallback to pending status on error
      setPaymentStatus('pending');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando estado final del pago...</p>
      </div>
    );
  }

  // This handles the race condition where the user lands on pending, but the payment was just approved.
  if (paymentStatus === 'approved') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Card className="border-green-200 bg-green-50">
              <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                      <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold">¡Pago Aprobado!</CardTitle>
                  <p className="text-muted-foreground">Mientras esperabas, tu pago fue confirmado con éxito. ¡Gracias por tu compra!</p>
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
