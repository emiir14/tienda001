'use client';

import { useEffect, useState, Suspense, ElementType } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Mail, Home, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';

interface StatusInfo {
  title: string;
  message: string;
  Icon: ElementType;
  color: string;
  cardClass: string;
}

function CheckoutStatusClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { addToCart, clearCart } = useCart(); // Corrected: use addToCart

  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null);

  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails();
    } else {
      setLoading(false);
      setStatusInfo(getStatusMessages('error'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const getStatusMessages = (status: string | null): StatusInfo => {
    switch (status) {
      case 'approved':
        return {
          title: '¡Gracias por tu compra!',
          message: 'Tu pago ha sido procesado exitosamente.',
          Icon: CheckCircle,
          color: 'text-green-600',
          cardClass: 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
        };
      case 'in_process':
      case 'pending':
        return {
          title: 'Pago en Proceso',
          message: 'Tu pago está pendiente de confirmación. Hemos restaurado tu carrito por si deseas modificarlo o intentar otro método de pago.',
          Icon: Clock,
          color: 'text-yellow-600',
          cardClass: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800'
        };
      case 'rejected':
        return {
          title: 'Pago Rechazado',
          message: 'El pago fue rechazado. No te preocupes, hemos restaurado tu carrito para que puedas intentar nuevamente.',
          Icon: AlertCircle,
          color: 'text-red-600',
          cardClass: 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
        };
      default:
        return {
          title: 'Error en la Compra',
          message: 'Parece que el proceso de pago no se completó. Hemos guardado tus productos en el carrito.',
          Icon: AlertCircle,
          color: 'text-red-600',
          cardClass: 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
        };
    }
  };

  const fetchPaymentDetails = async () => {
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
      setPaymentData(data);
      setStatusInfo(getStatusMessages(data.status));

      if (data.status === 'approved') {
        console.log('Payment approved, clearing cart.');
        clearCart();
      }
      
      if (data.restorableCartItems && Array.isArray(data.restorableCartItems)) {
        for (const item of data.restorableCartItems) {
          addToCart(item, item.quantity); // Corrected: use addToCart
        }
        toast({
          title: "Carrito Restaurado",
          description: "Los productos de tu orden han sido restaurados en tu carrito de compras.",
        });
      }

    } catch (error) {
      console.error('Error fetching payment details:', error);
      setStatusInfo(getStatusMessages('error'));
      toast({
        title: "Error",
        description: "No se pudieron verificar los detalles de tu compra. Por favor, revisa tu carrito.",
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
          <p className="text-muted-foreground">Verificando el estado de tu pago...</p>
        </div>
    );
  }

  if (!statusInfo) {
    return null;
  }

  const { Icon, cardClass } = statusInfo;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <Card className={cardClass}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Icon className={`h-16 w-16 ${statusInfo.color}`} />
          </div>
          <CardTitle className="text-2xl font-bold">
            {statusInfo.title}
          </CardTitle>
          <p className="text-muted-foreground text-base">
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
                <p className="font-mono text-sm break-all">{paymentData.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="font-semibold capitalize">{paymentData.status}</p>
              </div>
            </div>
            {paymentData.transaction_amount && (
              <div>
                <p className="text-sm text-muted-foreground">Monto Total</p>
                <p className="font-semibold text-lg">${paymentData.transaction_amount.toLocaleString('es-AR')}</p>
              </div>
            )}
            {paymentData.external_reference && (
              <div>
                <p className="text-sm text-muted-foreground">ID de Orden</p>
                <p className="font-mono text-sm">{paymentData.external_reference}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )
    }

      <Card>
          <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => router.push('/')} className="flex-grow"><Home className="h-4 w-4 mr-2" />Ir al Inicio</Button>
                  <Button variant="outline" onClick={() => router.push('/tienda')} className="flex-grow"><Package className="h-4 w-4 mr-2" />Seguir Comprando</Button>
              </div>
          </CardContent>
      </Card>
      
      {statusInfo.title === '¡Gracias por tu compra!' && (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Próximos Pasos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Te enviaremos un email con los detalles de tu compra. Revisa tu bandeja de entrada y de spam.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CheckoutStatusPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando resultado...</p>
      </div>
    }>
      <CheckoutStatusClient />
    </Suspense>
  );
}
