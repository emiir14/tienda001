'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Home, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';

function CheckoutPendingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [externalReference, setExternalReference] = useState<string | null>(null);

  useEffect(() => {
    const pid = searchParams.get('payment_id');
    const ref = searchParams.get('external_reference');
    setPaymentId(pid);
    setExternalReference(ref);

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

      if (!response.ok) {
        throw new Error('Failed to fetch payment status');
      }

      const data = await response.json();

      if (data.restorableCartItems && Array.isArray(data.restorableCartItems)) {
        for (const item of data.restorableCartItems) {
          addToCart(item, item.quantity);
        }
        toast({
          title: "Carrito Restaurado",
          description: "Tu compra anterior no se completó, así que hemos restaurado los productos en tu carrito.",
        });
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast({
        title: "Error",
        description: "No se pudo verificar el estado del pago, pero hemos restaurado tu carrito.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      <Card className="border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="h-16 w-16 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Pago Pendiente
          </CardTitle>
          <p className="text-muted-foreground">
            Tu pago está siendo procesado o no se completó. Hemos restaurado tu carrito por si necesitas reintentar la compra.
          </p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ¿Qué significa esto?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            A veces, los pagos no se aprueban instantáneamente. Si completaste el pago, puede que solo sea una demora. Te enviaremos un email de confirmación si se aprueba.
          </p>
           <p className="text-muted-foreground">
            Si abandonaste el proceso, tus productos te esperan en el carrito.
          </p>
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
          <Package className="h-4 w-4" /> Ir al Carrito
        </Button>
        <Button variant="outline" onClick={() => router.push('/')} className="flex items-center gap-2">
          <Home className="h-4 w-4" /> Ir al Inicio
        </Button>
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
