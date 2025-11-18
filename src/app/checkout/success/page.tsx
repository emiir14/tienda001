'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Mail, Home, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';

function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart();

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status'); // Comes from MP redirect

  useEffect(() => {
    // The transaction is complete, so we remove the pending order ID marker.
    localStorage.removeItem('pendingOrderId');

    // On success, we ALWAYS clear the cart.
    if (status === 'approved') {
      console.log('Payment approved via URL param, clearing cart.');
      clearCart();
    }
    
    if (paymentId) {
      fetchPaymentDetails(paymentId);
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, status, clearCart]);

  const fetchPaymentDetails = async (pId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: pId }),
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentData(data);
        if (data.status === 'approved') {
          console.log('Payment approved via API confirmation, clearing cart.');
          clearCart();
        }
      } else {
        if (status !== 'approved') {
            toast({
              title: "Advertencia",
              description: "No se pudieron obtener los detalles del pago, pero tu compra fue registrada.",
            });
        }
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      if (status !== 'approved') {
          toast({
            title: "Advertencia",
            description: "No se pudieron obtener los detalles del pago, pero tu compra fue registrada.",
          });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Confirmando tu compra...</p>
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className={`h-16 w-16 text-green-600`} />
          </div>
          <CardTitle className="text-2xl font-bold">
            ¡Gracias por tu compra!
          </CardTitle>
          <p className="text-muted-foreground">
            Tu pago ha sido procesado exitosamente.
          </p>
        </CardHeader>
      </Card>

      {paymentData && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Detalles del Pedido</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">ID de Pago</p>
                    <p className="font-mono text-sm break-all">{paymentData.id}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="font-semibold capitalize">{paymentData.status}</p>
                </div>
            </div>
            {paymentData.external_reference && (
              <div>
                <p className="text-sm text-muted-foreground">Referencia de Orden</p>
                <p className="font-mono text-sm">{paymentData.external_reference}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Próximos Pasos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Te enviaremos un email con los detalles de tu compra y la información de seguimiento en breve. Revisa tu bandeja de entrada y de spam.</p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={() => router.push('/')} className="flex items-center gap-2"><Home className="h-4 w-4" />Ir al Inicio</Button>
        <Button variant="outline" onClick={() => router.push('/tienda')} className="flex items-center gap-2"><Package className="h-4 w-4" />Seguir Comprando</Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando resultado...</p>
        </div>
    }>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
