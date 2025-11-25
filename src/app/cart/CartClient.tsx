
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ShoppingBag, Ticket, XCircle, Loader2, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState, KeyboardEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getCouponByCode } from '@/lib/data';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function CartClient() {
  const router = useRouter();
  const { cartItems, removeFromCart, updateQuantity, subtotal, cartCount, appliedCoupon, applyCoupon, removeCoupon, discount, totalPrice, isCouponApplicable } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [isLoadingCoupon, setIsLoadingCoupon] = useState(false);
  const { toast } = useToast();

  const originalSubtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalDiscount = originalSubtotal - totalPrice;

  const handleApplyCoupon = async () => {
      if (!couponCode) return;
      setIsLoadingCoupon(true);
      try {
        const coupon = await getCouponByCode(couponCode);
        if (coupon) {
            if (coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) {
                toast({
                    title: "Compra mínima no alcanzada",
                    description: `Necesitas comprar al menos $${coupon.minPurchaseAmount.toLocaleString('es-AR')} para usar este cupón.`,
                    variant: "destructive",
                });
            } else {
                applyCoupon(coupon);
                toast({ title: "Éxito", description: "Cupón aplicado correctamente." });
            }
        } else {
            toast({ title: "Error", description: "El cupón no es válido o ha expirado.", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      }
      setIsLoadingCoupon(false);
      setCouponCode("");
  }

  const handleNumericKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (['e', 'E', '+', '-'].includes(e.key)) {
          e.preventDefault();
      }
  };

  const handleQuantityChange = (productId: number, value: string) => {
    if (value === '') {
        updateQuantity(productId, 0);
    } else {
        const newQuantity = parseInt(value, 10);
        if (!isNaN(newQuantity) && newQuantity >= 0) {
            updateQuantity(productId, newQuantity);
        }
    }
  };

  const handleCheckout = () => {
    const itemOverStock = cartItems.find(item => item.quantity > item.product.stock);
    if (itemOverStock) {
      toast({
        title: "Stock Insuficiente",
        description: `Disculpe las molestias. Para "${itemOverStock.product.name}", la cantidad ingresada supera el stock disponible.`,
        variant: "destructive",
      });
      return;
    }

    const invalidItems = cartItems.filter(item => item.quantity <= 0);
    if (invalidItems.length > 0) {
        toast({
            title: "Cantidad inválida",
            description: `Por favor, asegúrate de que todos los productos tengan una cantidad de al menos 1. El producto "${invalidItems[0].product.name}" tiene una cantidad inválida.`,
            variant: "destructive"
        });
        return;
    }

    if (cartCount <= 0) {
        toast({
            title: "Carrito vacío",
            description: "No puedes proceder al pago con el carrito vacío.",
            variant: "destructive"
        });
        return;
    }
    router.push('/checkout');
  };


  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-headline font-bold mb-8">Tu Carrito de Compras</h1>
      {cartItems.length === 0 ? (
        <Card className="text-center py-12">
            <CardContent className="flex flex-col items-center gap-4">
                <ShoppingBag className="w-16 h-16 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Tu carrito está vacío</h2>
                <p className="text-muted-foreground">Parece que todavía no has añadido nada.</p>
                <Button asChild className="mt-4">
                    <Link href="/tienda">Empezar a comprar</Link>
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-4">
            {cartItems.map(({ product, quantity }) => (
              <Card key={product.id} className="flex items-center p-3">
                <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/80x80/EFEFEF/333333?text=Sin+Imagen"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                </div>
                <div className="flex-1 ml-3">
                  <Link href={`/products/${product.id}`} className="font-semibold hover:text-primary text-base leading-tight">{product.name}</Link>
                  {/* --- INICIO DE LA MODIFICACIÓN -- */}
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="font-semibold text-primary">${(product.salePrice ?? product.price).toLocaleString('es-AR')}</p>
                    {product.salePrice && product.salePrice < product.price && (
                      <p className="text-sm text-muted-foreground line-through">
                        ${product.price.toLocaleString('es-AR')}
                      </p>
                    )}
                  </div>
                  {/* --- FIN DE LA MODIFICACIÓN -- */}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Input
                    type="number"
                    min="0"
                    max="500"
                    value={quantity === 0 ? '' : quantity}
                    onKeyDown={handleNumericKeyDown}
                    onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                    className="w-16 h-9 text-center"
                    aria-label={`Cantidad de ${product.name}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeFromCart(product.id)} aria-label={`Quitar ${product.name} del carrito`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isCouponApplicable && (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            No puedes aplicar cupones cuando hay productos en oferta en tu carrito.
                        </AlertDescription>
                    </Alert>
                )}
                {!appliedCoupon && (
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Código de Cupón" 
                            value={couponCode} 
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                            disabled={!isCouponApplicable}
                        />
                        <Button onClick={handleApplyCoupon} disabled={isLoadingCoupon || !couponCode || !isCouponApplicable}>
                            {isLoadingCoupon ? <Loader2 className="animate-spin" /> : "Aplicar"}
                        </Button>
                    </div>
                )}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${originalSubtotal.toLocaleString('es-AR')}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between items-center text-primary">
                      <div className="flex items-center gap-2">
                          <span>Descuento</span>
                          {appliedCoupon && (
                            <div className='flex items-center gap-1 text-xs'>
                              (<Ticket className="h-3 w-3"/> {appliedCoupon.code}
                              <button onClick={removeCoupon} className="text-destructive"><XCircle className="h-3 w-3"/></button>)
                            </div>
                          )}
                      </div>
                      <span>-${totalDiscount.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>A coordinar</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${totalPrice.toLocaleString('es-AR')}</span>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch">
                <Button onClick={handleCheckout} size="lg" className="w-full">
                  Comprar
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full mt-2">
                    <Link href="/tienda">
                        Seguir Comprando
                    </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
