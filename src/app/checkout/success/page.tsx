
"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Package, Store, Info } from 'lucide-react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('orderId');
    const type = searchParams.get('type');

    if (type === 'store_payment') {
        return (
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <div className="flex flex-col items-center text-center">
                        <Store className="h-12 w-12 text-primary mb-4" />
                        <CardTitle className="text-2xl font-bold">¡Tu pedido ha sido generado!</CardTitle>
                        <CardDescription className="mt-2 text-muted-foreground">
                            Gracias por tu compra. Anota tu número de pedido.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="text-center">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                        <p className="text-lg font-semibold text-primary">Número de Pedido:</p>
                        <p className="text-3xl font-bold tracking-wider font-mono">{orderId}</p>
                    </div>
                    <div className="text-left space-y-4 text-muted-foreground">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 mt-1 flex-shrink-0" />
                            <p>
                                <strong>Próximos pasos:</strong> Acércate a nuestro local para pagar y retirar tu pedido. 
                                No olvides mencionar tu número de pedido al personal.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                             <Info className="h-5 w-5 mt-1 flex-shrink-0" />
                            <p>
                                <strong>Importante:</strong> Tu pedido estará disponible para retiro durante las próximas 72 horas.
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => router.push('/tienda')} className="w-full mt-8">
                        Seguir Comprando
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <div className="flex flex-col items-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                    <CardTitle className="text-2xl font-bold">¡Pago Exitoso!</CardTitle>
                    <CardDescription className="mt-2 text-muted-foreground">
                        Tu compra ha sido procesada correctamente.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="text-center">
                <div className="bg-gray-100 rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground">ID de Pedido:</p>
                    <p className="text-xl font-semibold">{orderId || 'Procesando...'}</p>
                </div>
                 <div className="flex items-center justify-center gap-3 text-muted-foreground mb-6">
                    <Package className="h-5 w-5" />
                    <p>En breve recibirás un email con los detalles de tu compra.</p>
                </div>
                <Button onClick={() => router.push('/tienda')} className="w-full">
                    Volver a la Tienda
                </Button>
            </CardContent>
        </Card>
    );
}


export default function SuccessPage() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] bg-gray-50/50 p-4">
           <Suspense fallback={<div className="text-center"><p>Cargando confirmación...</p></div>}>
                <SuccessContent />
           </Suspense>
        </div>
    );
}
