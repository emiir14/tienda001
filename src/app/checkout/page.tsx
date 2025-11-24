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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, Suspense, useMemo } from "react";
import { Loader2, ShoppingCart, CreditCard, AlertTriangle, Truck, Store, HandCoins } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { createOrder } from "@/lib/data";
import { DeliveryMethod } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { useShippingStore } from "@/store/shipping-store";


const checkoutSchema = z.object({
  name: z.string().min(2, "El nombre completo es requerido."),
  email: z.string().email("El email ingresado no es válido."),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos."),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  pickupName: z.string().optional(),
  pickupDNI: z.string().optional(),
  deliveryMethod: z.string(),
})
.superRefine((data, ctx) => {
    if (data.deliveryMethod === 'shipping') {
        if (!data.address || data.address.length < 5) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address'], message: 'La dirección es requerida.' });
        }
        if (!data.city || data.city.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['city'], message: 'La ciudad es requerida.' });
        }
        if (!data.postalCode || data.postalCode.length < 4) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['postalCode'], message: 'El código postal es requerido.' });
        }
    }
    if (data.deliveryMethod === 'pickup' || data.deliveryMethod === 'pay_in_store') {
        if (!data.pickupName || data.pickupName.length < 3) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pickupName'], message: 'El nombre y apellido de quien retira son requeridos.' });
        }
        if (!data.pickupDNI || !/^\\d{7,8}$/.test(data.pickupDNI)) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pickupDNI'], message: 'El DNI debe tener entre 7 y 8 dígitos numéricos.' });
        }
    }
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

function CheckoutForm() {
  const { cartItems, subtotal, appliedCoupon, cartCount, clearCart } = useCart();
  const { shippingCost, postalCode: shippingPostalCode, setPostalCode, reset } = useShippingStore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAdBlockerWarning, setShowAdBlockerWarning] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping');

  const {
    originalSubtotal,
    productDiscount,
    couponDiscount,
    localPaymentDiscount,
    finalTotalPrice,
    totalDiscount
  } = useMemo(() => {
    const originalSubtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const productDiscount = originalSubtotal - subtotal;

    let couponDiscountValue = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        couponDiscountValue = subtotal * (appliedCoupon.discountValue / 100);
      } else {
        couponDiscountValue = appliedCoupon.discountValue;
      }
    }

    const subtotalAfterCoupons = subtotal - couponDiscountValue;
    const isPayInStore = deliveryMethod === 'pay_in_store';
    const localPaymentDiscountValue = isPayInStore ? subtotalAfterCoupons * 0.20 : 0;
    
    const shippingCostValue = deliveryMethod === 'shipping' ? (shippingCost ?? 0) : 0;

    const finalTotalPrice = subtotalAfterCoupons - localPaymentDiscountValue + shippingCostValue;
    const totalDiscount = productDiscount + couponDiscountValue + localPaymentDiscountValue;

    return {
      originalSubtotal, productDiscount, couponDiscount: couponDiscountValue,
      localPaymentDiscount: localPaymentDiscountValue, finalTotalPrice, totalDiscount
    };
  }, [cartItems, subtotal, appliedCoupon, deliveryMethod, shippingCost]);

  const isPayInStore = deliveryMethod === 'pay_in_store';

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: "", email: "", phone: "", address: "", city: "", postalCode: shippingPostalCode || "", pickupName: "", pickupDNI: "", deliveryMethod: 'shipping' },
  });
  
  useEffect(() => {
    form.setValue('deliveryMethod', deliveryMethod);
     if (deliveryMethod !== 'shipping') {
      reset();
      form.setValue('postalCode', '');
    }
  }, [deliveryMethod, form, reset]);

  useEffect(() => {
    if (shippingPostalCode) {
      form.setValue('postalCode', shippingPostalCode);
    }
  }, [shippingPostalCode, form]);

  const postalCodeValue = form.watch("postalCode");
  useEffect(() => {
    if (deliveryMethod === 'shipping' && postalCodeValue && postalCodeValue.length >= 4) {
      setPostalCode(postalCodeValue);
    }
  }, [postalCodeValue, setPostalCode, deliveryMethod]);

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

  const handleCheckoutSubmit = async (values: CheckoutFormData) => {
    setIsLoading(true);
    try {
      if (cartCount === 0) throw new Error("El carrito está vacío.");
      if (deliveryMethod === 'shipping' && (shippingCost === null || shippingCost === undefined)) {
        throw new Error("Por favor, calcula el costo de envío antes de continuar.");
      }

      const orderItems = cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        image: item.product.images[0] ?? '',
        quantity: item.quantity,
        priceAtPurchase: item.product.salePrice ?? item.product.price,
        originalPrice: (item.product.salePrice && item.product.salePrice < item.product.price) ? item.product.price : null,
      }));

      const orderData = {
        customerName: values.name,
        customerEmail: values.email,
        customerPhone: values.phone,
        total: finalTotalPrice,
        items: orderItems,
        couponCode: appliedCoupon?.code,
        discountAmount: totalDiscount,
        deliveryMethod: deliveryMethod,
        shippingAddress: values.address,
        shippingCity: values.city,
        shippingPostalCode: values.postalCode,
        shippingCost: deliveryMethod === 'shipping' ? shippingCost : 0,
        pickupName: values.pickupName,
        pickupDni: values.pickupDNI,
      };

      if (isPayInStore) {
        const orderResponse = await createOrder({ ...orderData, status: 'awaiting_payment_in_store' });
        if (orderResponse.error || !orderResponse.orderId) throw new Error(orderResponse.error || "No se pudo generar el pedido.");
        clearCart();
        router.push(`/checkout/success?orderId=${orderResponse.orderId}&type=store_payment`);
      } else {
        const orderResponse = await createOrder({ ...orderData, status: 'pending_payment' });
        if (orderResponse.error || !orderResponse.orderId) throw new Error(orderResponse.error || "No se pudo crear la orden.");

        localStorage.setItem('pendingOrderId', String(orderResponse.orderId));

        const mpResponse = await fetch('/api/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              items: cartItems, 
              orderId: orderResponse.orderId, 
              shippingCost: deliveryMethod === 'shipping' ? shippingCost : 0,
              discountAmount: couponDiscount, 
              couponCode: appliedCoupon?.code 
          }),
        });

        if (!mpResponse.ok) {
          const errorData = await mpResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Error del servidor: ${mpResponse.status}`);
        }

        const preferenceData = await mpResponse.json();
        if (!preferenceData.init_point) throw new Error("No se pudo obtener el link de pago.");

        window.location.href = preferenceData.init_point;
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      toast({ title: "Error al finalizar la compra", description: (error as Error).message, variant: "destructive" });
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

  const renderOrderSummary = () => {
    const hasProductDiscount = productDiscount > 0;
    const showShipping = deliveryMethod === 'shipping';
    
    return (
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <h2 className="text-3xl font-headline font-bold mb-6">Resumen de tu compra</h2>
          <Card className="shadow-lg">
            <CardContent className="p-6 space-y-4">
              {cartItems.map(item => {
                const hasSale = item.product.salePrice && item.product.salePrice < item.product.price;
                const itemTotal = (item.product.salePrice ?? item.product.price) * item.quantity;
                const originalItemTotal = item.product.price * item.quantity;

                return (
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
                    <div className="flex flex-col items-end">
                      <p className="font-medium">
                        {formatCurrency(itemTotal)}
                      </p>
                      {hasSale && (
                        <p className="text-sm text-muted-foreground line-through">
                          {formatCurrency(originalItemTotal)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <Separator className="my-4"/>
              <div className="space-y-2">
                <div className="flex justify-between">
                    <p className="text-muted-foreground">Subtotal</p>
                    <p className={hasProductDiscount ? "line-through text-muted-foreground" : ""}>
                        {formatCurrency(originalSubtotal)}
                    </p>
                </div>
                {hasProductDiscount && (
                    <div className="flex justify-between">
                        <p className="text-muted-foreground">Subtotal c/ Dtos.</p>
                        <p>{formatCurrency(subtotal)}</p>
                    </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-primary">
                    <div className="flex items-center gap-2">
                      <span>Descuento Cupón</span>
                      {appliedCoupon && (
                        <span className='text-xs font-medium'>({appliedCoupon.code})</span>
                      )}
                    </div>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                {isPayInStore && (
                  <div className="flex justify-between text-primary font-medium">
                      <span>Dto. pago en local (20%)</span>
                      <span>-{formatCurrency(localPaymentDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Envío</p>
                  <p>
                    {showShipping 
                      ? (shippingCost !== null ? formatCurrency(shippingCost) : "Calcula tu envío")
                      : "No aplica"}
                  </p>
                </div>
                <Separator className="my-4"/>
                <div className="flex justify-between font-bold text-xl"><p>Total</p><p>{formatCurrency(finalTotalPrice)}</p></div>
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
  };

  const getButtonText = () => {
      if (isLoading) return <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</>;
      if (isPayInStore) return "Generar Pedido";
      return "Continuar y Pagar con Mercado Pago";
  }

  return (
    <div className="grid lg:grid-cols-3 gap-12 max-w-7xl mx-auto py-8">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-headline font-bold mb-6">Finalizar Compra</h1>
        <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>1. Elige cómo quieres obtener tu pedido</CardTitle></CardHeader>
              <CardContent>
                <RadioGroup value={deliveryMethod} onValueChange={(val) => setDeliveryMethod(val as DeliveryMethod)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Label htmlFor="shipping" className="cursor-pointer flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="shipping" id="shipping" className="sr-only" /><Truck className="mb-3 h-6 w-6" />Envío a Domicilio</Label>
                  <Label htmlFor="pickup" className="cursor-pointer flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="pickup" id="pickup" className="sr-only" /><Store className="mb-3 h-6 w-6" />Retiro en Local</Label>
                  <Label htmlFor="pay_in_store" className="cursor-pointer flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="pay_in_store" id="pay_in_store" className="sr-only" /><HandCoins className="mb-3 h-6 w-6" /><span className="text-center">Pago en Local<br/>(20% OFF)</span></Label>
                </RadioGroup>
              </CardContent>
            </Card>

            {showAdBlockerWarning && ( <Card className="border-yellow-200 bg-yellow-50 mb-6"><CardContent className="p-4"><div className="flex items-center gap-2 text-yellow-800"><AlertTriangle className="h-5 w-5" /><p className="text-sm"><strong>Importante:</strong> Detectamos un bloqueador de anuncios activo. Por favor desactívalo para este sitio para asegurar que el sistema de pagos funcione correctamente.</p></div></CardContent></Card> )}

            {isLoading ? (
                <div className="flex flex-col justify-center items-center h-96 gap-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-muted-foreground">Procesando tu orden...</p></div>
            ) : (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCheckoutSubmit)} className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>2. Completa tus datos de contacto</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} placeholder="Juan Pérez" /></FormControl><FormMessage /></FormItem> )}/>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} placeholder="juan@email.com" /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} placeholder="1122334455" /></FormControl><FormMessage /></FormItem> )}/>
                        </div>
                    </CardContent>
                </Card>

                {deliveryMethod === 'shipping' && ( <Card><CardHeader><CardTitle>3. Información de Envío</CardTitle></CardHeader><CardContent className="space-y-4"><FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} placeholder="Av. Corrientes 1234" /></FormControl><FormMessage /></FormItem> )}/><div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} placeholder="Buenos Aires" /></FormControl><FormMessage /></FormItem> )}/><FormField control={form.control} name="postalCode" render={({ field }) => ( <FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input {...field} placeholder="1001" /></FormControl><FormMessage /></FormItem> )}/></div><ShippingCalculator /></CardContent></Card> )}
                {(deliveryMethod === 'pickup' || deliveryMethod === 'pay_in_store') && ( <Card><CardHeader><CardTitle>3. Información de Retiro</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Por favor, completa los datos de la persona que va a retirar el pedido. El DNI será solicitado al momento de la entrega.</p><FormField control={form.control} name="pickupName" render={({ field }) => ( <FormItem><FormLabel>Nombre y Apellido de quien retira</FormLabel><FormControl><Input {...field} placeholder="El nombre que figura en el DNI" /></FormControl><FormMessage /></FormItem> )}/><FormField control={form.control} name="pickupDNI" render={({ field }) => ( <FormItem><FormLabel>DNI de quien retira</FormLabel><FormControl><Input {...field} placeholder="Sin puntos ni espacios" /></FormControl><FormMessage /></FormItem> )}/></CardContent></Card> )}

                <Button type="submit" size="lg" className="w-full" disabled={isLoading || (deliveryMethod === 'shipping' && shippingCost === null)}>{getButtonText()}</Button>
                </form>
            </Form>
            )}
        </div>
      </div>
      {renderOrderSummary()}
    </div>
  );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <CheckoutForm />
        </Suspense>
    )
}
