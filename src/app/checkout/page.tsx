
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
import { createOrder } from "@/lib/data";

const shippingSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  email: z.string().email("Email inválido."),
  phone: z.string().min(10, "El número de teléfono debe tener al menos 10 dígitos.").max(15, "El número de teléfono no puede tener más de 15 dígitos."),
  address: z.string().min(5, "La dirección es requerida."),
  city: z.string().min(2, "La ciudad es requerida."),
  postalCode: z.string().min(4, "El código postal es requerido."),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

export default function CheckoutPage() {
  const { cartItems, subtotal, appliedCoupon, discount, totalPrice, cartCount } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAdBlockerWarning, setShowAdBlockerWarning] = useState(false);

  const originalSubtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalDiscount = originalSubtotal - totalPrice;
  
  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { name: "", email: "", phone: "", address: "", city: "", postalCode: "" },
  });

  useEffect(() => {
    const checkAdBlocker = async () => {
      try {
        await fetch(new Request('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')).catch(() => {
          setShowAdBlockerWarning(true);
        });
      } catch (error) {
        setShowAdBlockerWarning(true);
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
      
      const orderDataForDb = {
        customerName: values.name,
        customerEmail: values.email,
        customerPhone: values.phone,
        total: totalPrice,
        status: 'pending' as const,
        items: cartItems,
        shippingAddress: values.address,
        shippingCity: values.city,
        shippingPostalCode: values.postalCode,
        couponCode: appliedCoupon?.code,
        discountAmount: discount,
      };

      const orderResponse = await createOrder(orderDataForDb);
      if (orderResponse.error || !orderResponse.orderId) {
        throw new Error(orderResponse.error || "No se pudo crear la orden en la base de datos.");
      }
      console.log("Order created successfully with ID:", orderResponse.orderId);
      
      localStorage.setItem('pendingOrderId', String(orderResponse.orderId));

      const requestBodyForMp = {
        items: cartItems,
        customer: {
          name: values.name,
          email: values.email, 
        },
        orderId: orderResponse.orderId,
        discountAmount: discount,
        couponCode: appliedCoupon?.code
      };

      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBodyForMp),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor: ${response.status}`);
      }

      const preferenceData = await response.json();
      
      if (!preferenceData.id || !preferenceData.init_point) {
        throw new Error("Datos de preferencia de pago inválidos recibidos del servidor");
      }

      console.log("Preference created successfully, redirecting...", preferenceData);
      
      window.location.href = preferenceData.init_point;
      
    } catch (error) {
      console.error("Error during checkout process:", error);
      let errorMessage = (error instanceof Error) ? error.message : "Error desconocido";
      toast({ title: "Error en el Checkout", description: errorMessage, variant: "destructive" });
      setIsLoading(false);
    }
  };
  
  if (cartCount === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
        <Button onClick={() => router.push('/tienda')}>Ir a la tienda</Button>
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY) {
    return (
      <div className="text-center py-12 text-destructive">
        <h1 className="text-2xl font-semibold">Error de Configuración</h1>
        <p className="text-muted-foreground mt-2">El sistema de pagos no está configurado.</p>
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
                <p>${originalSubtotal.toLocaleString('es-AR')}</p>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-primary">
                  <div className="flex items-center gap-2">
                    <span>Descuento</span>
                    {appliedCoupon && (
                      <span className='text-xs font-medium'>({appliedCoupon.code})</span>
                    )}
                  </div>
                  <span>-${totalDiscount.toLocaleString('es-AR')}</span>
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
    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto py-8">
      <div className="lg:col-span-1">
        <h1 className="text-3xl font-headline font-bold mb-6">Finalizar Compra</h1>

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
        
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-96 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Procesando tu orden y preparando el pago...</p>
            <p className="text-sm text-muted-foreground mt-2">No cierres esta ventana.</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleShippingSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Información de Envío y Contacto</CardTitle>
                  <CardDescription>Completa tus datos para el envío y la confirmación del pedido.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl><Input {...field} placeholder="Juan Pérez" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" {...field} placeholder="juan@email.com" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl><Input type="tel" {...field} placeholder="1122334455" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                  </div>
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
                        Procesando...
                      </>
                    ) : (
                      "Continuar y Pagar con Mercado Pago"
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
