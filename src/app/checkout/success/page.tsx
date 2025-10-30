'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Mail, Home, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useCart } from '@/hooks/useCart';

function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart();

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');
  const merchantOrderId = searchParams.get('merchant_order_id');
  const preferenceId = searchParams.get('preference_id');

  useEffect(() => {
    // Only clear the cart if the payment was explicitly approved.
    if (status === 'approved') {
      console.log('Payment approved, clearing cart.');
      clearCart();
    }
    
    if (paymentId) {
      fetchPaymentDetails();
    } else {
      // If there's no payment_id, it's likely not a valid success redirect.
      // However, we show a generic success message just in case, but don't fetch.
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, status]);

  const fetchPaymentDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, status, merchantOrderId, preferenceId })
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentData(data);
      } else {
        toast({
          title: "Advertencia",
          description: "No se pudieron obtener los detalles del pago, pero tu compra fue registrada.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast({
        title: "Advertencia",
        description: "No se pudieron obtener los detalles del pago, pero tu compra fue registrada.",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    // The "success" page should primarily handle the approved case.
    // Other cases are handled by their respective pages (pending, failure).
    return {
      title: '¡Gracias por tu compra!',
      message: 'Tu pago ha sido procesado exitosamente.',
      color: 'text-green-600'
    };
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando el estado de tu pago...</p>
        </div>
    );
  }

  const statusInfo = getStatusMessage();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className={`h-16 w-16 ${statusInfo.color}`} />
          </div>
          <CardTitle className="text-2xl font-bold">
            {statusInfo.title}
          </CardTitle>
          <p className="text-muted-foreground">
            {statusInfo.message}
          </p>
        </CardHeader>
      </Card>

      {paymentData && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Detalles del Pedido</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ID del Pago</p>
                <p className="font-mono text-sm">{paymentData.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="font-semibold capitalize">{paymentData.status}</p>
              </div>
            </div>
            
            {paymentData.transaction_amount && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Monto Total</p>
                  <p className="font-semibold text-lg">${paymentData.transaction_amount.toLocaleString('es-AR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método de Pago</p>
                  <p className="font-semibold">{paymentData.payment_method_id || 'Mercado Pago'}</p>
                </div>
              </div>
            )}

            {externalReference && (
              <div>
                <p className="text-sm text-muted-foreground">ID de Orden</p>
                <p className="font-mono text-sm">{externalReference}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Próximos Pasos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold mt-1 shrink-0">1</div>
              <div>
                <p className="font-semibold">Confirmación por email</p>
                <p className="text-sm text-muted-foreground">Te enviaremos un email con los detalles de tu compra y la información de seguimiento.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold mt-1 shrink-0">2</div>
              <div>
                <p className="font-semibold">Preparación del pedido</p>
                <p className="text-sm text-muted-foreground">Comenzaremos a preparar tu pedido. Este proceso puede tomar 1-2 días hábiles.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold mt-1 shrink-0">3</div>
              <div>
                <p className="font-semibold">Coordinación del envío</p>
                <p className="text-sm text-muted-foreground">Nos pondremos en contacto contigo para coordinar la entrega de tu pedido.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={() => router.push('/')} className="flex items-center gap-2"><Home className="h-4 w-4" />Ir al Inicio</Button>
        <Button variant="outline" onClick={() => router.push('/tienda')} className="flex items-center gap-2"><Package className="h-4 w-4" />Seguir Comprando</Button>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Tienes alguna pregunta sobre tu pedido? <br />
            Contáctanos en <strong>soporte@tutienda.com</strong> o al teléfono <strong>(011) 1234-5678</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
