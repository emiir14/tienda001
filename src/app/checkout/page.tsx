
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Ticket, ArrowLeft, ShoppingCart, CreditCard, AlertTriangle, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const shippingSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  email: z.string().email("Email inválido."),
  address: z.string().min(5, "La dirección es requerida."),
  city: z.string().min(2, "La ciudad es requerida."),
  postalCode: z.string().min(4, "El código postal es requerido."),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

const MP_TEST_USERS = {
  buyer: "test_user_2602352930@testuser.com",
};

export default function CheckoutPage() {
  const { cartItems, subtotal, appliedCoupon, discount, totalPrice, cartCount } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [preferenceData, setPreferenceData] = useState<{
    preferenceId: string;
    initPoint: string;
    orderId: number;
  } | null>(null);
  const [showAdBlockerWarning, setShowAdBlockerWarning] = useState(false);
  
  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { name: "", email: "", address: "", city: "", postalCode: "" },
  });

  // Enhanced ad blocker detection
  useEffect(() => {
    const checkAdBlocker = async () => {
      try {
        const testAdUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        await fetch(new Request(testAdUrl)).catch(() => {
          setShowAdBlockerWarning(true);
        });
      } catch (error) {
        setShowAdBlockerWarning(true);
        console.log('Ad blocker detected.');
      }
    };
    
    checkAdBlocker();
  }, []);

  const handleShippingSubmit = async (values: ShippingFormData) => {
    setIsLoading(true);
    
    try {
      if (!cartItems || cartItems.length === 0) {
        throw new Error("El carrito está vacío");
      }
      
      const requestBody = {
        cartItems: cartItems, // Pass the full cartItems array
        shippingInfo: {
          ...values,
          email: process.env.NODE_ENV === 'development' 
            ? MP_TEST_USERS.buyer 
            : values.email,
        },
        totalPrice: Math.max(0.01, Number(totalPrice) || 1),
        discount: Number(discount) || 0,
        appliedCoupon: appliedCoupon || null
      };

      console.log("Creating payment preference with:", requestBody);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de red' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.preferenceId) {
        throw new Error("No se recibió el ID de preferencia del servidor");
      }

      console.log("Preference created successfully:", data);
      
      setPreferenceData({
        preferenceId: data.preferenceId,
        initPoint: data.initPoint || '',
        orderId: data.orderId
      });
      
    } catch (error) {
      console.error("Error creating preference:", error);
      
      let errorMessage = "Error desconocido";
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Tiempo de espera agotado. Intenta nuevamente.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentRedirect = () => {
    if (!preferenceData?.initPoint) {
      toast({
        title: "Error",
        description: "No se encontró el punto de inicio del pago.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Redirecting to:', preferenceData.initPoint);
      window.location.href = preferenceData.initPoint;
      
    } catch (error) {
      console.error('Error redirecting to payment:', error);
      toast({
        title: "Error",
        description: "Error al redirigir al sistema de pago",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    if (cartCount === 0 && !isLoading && !preferenceData) {
      const timer = setTimeout(() => {
        toast({ 
          title: 'Tu carrito está vacío', 
          description: 'Serás redirigido a la tienda.', 
          variant: 'destructive' 
        });
        router.push('/tienda');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [cartCount, router, isLoading, preferenceData, toast]);

  if (cartCount === 0 && !preferenceData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
        <p className="text-muted-foreground">Serás redirigido a la tienda...</p>
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY) {
    return (
      <div className="text-center py-12 text-destructive">
        <h1 className="text-2xl font-semibold">Error de Configuración</h1>
        <p className="text-muted-foreground mt-2">
          El sistema de pagos no está configurado. Por favor, contacta al administrador.
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          Variable faltante: NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
        </p>
      </div>
    );
  }

  const renderOrderSummary = () => (
    <div className="lg:col-span-1">
      <div className="sticky top-24">
        <h2 className="text-3xl font-headline font-bold mb-6">Resumen de tu compra</h2>
        <Card className="shadow-lg">
          <CardContent className="p-6 space-y-4">
            {cartItems.map(item => (
              <div key={item.product.id} className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                    <Image 
                      src={item.product.images[0] ?? "https://placehold.co/100x100.png"} 
                      alt={item.product.name} 
                      fill 
                      className="object-cover" 
                      data-ai-hint={item.product.aiHint}
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-medium text-right">
                  ${((item.product.salePrice ?? item.product.price) * item.quantity).toLocaleString('es-AR')}
                </p>
              </div>
            ))}
            <Separator className="my-4"/>
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Subtotal</p>
                <p>${subtotal.toLocaleString('es-AR')}</p>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-primary">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4"/>
                    <span>Cupón: {appliedCoupon.code}</span>
                  </div>
                  <span>-${discount.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <p className="text-muted-foreground">Envío</p>
                <p>A coordinar</p>
              </div>
              <Separator className="my-4"/>
              <div className="flex justify-between font-bold text-xl">
                <p>Total</p>
                <p>${totalPrice.toLocaleString('es-AR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Pagos seguros procesados por Mercado Pago</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
      <div className="lg:col-span-1">
        <h1 className="text-3xl font-headline font-bold mb-6">Finalizar Compra</h1>

        {process.env.NODE_ENV === 'development' && (
          <Card className="border-blue-200 bg-blue-50 mb-6">
            <CardHeader>
              <CardTitle className="text-blue-800 text-lg">🧪 Modo de Prueba Activo</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700 space-y-2">
              <p className="text-sm"><strong>Nota:</strong> Para que las redirecciones de Mercado Pago funcionen, asegúrate que la variable `NEXT_PUBLIC_SITE_URL` en tu archivo `.env.local` coincida con la URL de tu servidor de desarrollo (ej: `http://localhost:9002`).</p>
              <p className="text-sm"><strong>Email de prueba:</strong> {MP_TEST_USERS.buyer}</p>
              <div className="mt-3 p-3 bg-white rounded text-xs">
                <p><strong>Tarjetas de prueba:</strong></p>
                <p>✅ Aprobada: 4509 9535 6623 3704</p>
                <p>❌ Rechazada: 4000 0000 0000 0002</p>
                <p>⏳ Pendiente: 4000 0000 0000 0051</p>
              </div>
            </CardContent>
          </Card>
        )}

        {showAdBlockerWarning && (
          <Card className="border-yellow-200 bg-yellow-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm">
                  <strong>Importante:</strong> Detectamos un bloqueador de anuncios activo. 
                  Por favor desactívalo para este sitio para asegurar que el sistema de pagos funcione correctamente.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex items-center gap-4 mb-8">
          <div className={cn("flex items-center gap-2", !preferenceData ? 'text-primary font-bold' : 'text-muted-foreground')}>
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-sm", !preferenceData ? 'bg-primary text-primary-foreground' : 'bg-muted')}>1</div>
            <span>Envío</span>
          </div>
          <Separator className="flex-1" />
          <div className={cn("flex items-center gap-2", preferenceData ? 'text-primary font-bold' : 'text-muted-foreground')}>
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-sm", preferenceData ? 'bg-primary text-primary-foreground' : 'bg-muted')}>2</div>
            <span>Pago</span>
          </div>
        </div>

        {isLoading && !preferenceData ? (
          <div className="flex flex-col justify-center items-center h-96 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Configurando tu pago...</p>
          </div>
        ) : preferenceData ? (
          <Card>
            <CardHeader>
              <CardTitle>2. Finalizar Pago</CardTitle>
              <CardDescription>
                Serás redirigido a MercadoPago para completar tu pago de forma segura.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center p-8">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Pago Seguro con MercadoPago</h3>
              <p className="text-muted-foreground mb-6">
                Tu información está protegida y será procesada de forma segura
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-100 p-3 rounded mb-4 text-sm text-yellow-800">
                  <p><strong>Importante:</strong> Usa las credenciales de prueba mostradas arriba</p>
                </div>
              )}
              
              <Button 
                size="lg" 
                onClick={handlePaymentRedirect}
                disabled={isLoading}
                className="w-full max-w-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirigiendo...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Continuar al Pago
                  </>
                )}
              </Button>
            </CardContent>
            <CardFooter className="justify-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setPreferenceData(null);
                }} 
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4"/> Volver a Información de Envío
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleShippingSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>1. Información de Envío</CardTitle>
                  <CardDescription>Completa tus datos para el envío del pedido</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl><Input {...field} placeholder="Juan Pérez" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} placeholder="juan@email.com" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl><Input {...field} placeholder="Av. Corrientes 1234" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl><Input {...field} placeholder="Buenos Aires" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="postalCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Postal</FormLabel>
                        <FormControl><Input {...field} placeholder="1001" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Configurando pago...
                      </>
                    ) : (
                      "Continuar al Pago"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        )}
      </div>

      {renderOrderSummary()}
    </div>
  );
}
