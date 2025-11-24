
"use client";

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { AlertTriangle, CheckCircle2, Home, CreditCard, Truck, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { LiveVisitorCounter } from './LiveVisitorCounter';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/ProductCard';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ShippingCalculator } from '@/components/ShippingCalculator';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Badge } from '@/components/ui/badge';

export function ProductPageClient({ product, relatedProducts }: { product: Product, relatedProducts: Product[] }) {
  const hasStock = product.stock > 0;

  return (
    <div className="space-y-12 pt-8">
      <Breadcrumbs />
      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        {/* Columna de Imagen */}
        <div className="w-full">
            <Carousel className="w-full">
                <CarouselContent>
                    {product.images && product.images.length > 0 ? (
                        product.images.map((img, index) => (
                             <CarouselItem key={index}>
                                <Card className='overflow-hidden rounded-lg shadow-lg'>
                                    <CardContent className="p-0 flex aspect-[4/5] items-center justify-center">
                                         <Image
                                            src={img}
                                            alt={`${product.name} - image ${index + 1}`}
                                            width={800}
                                            height={1000}
                                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                            priority={index === 0}
                                            data-ai-hint={product.aiHint}
                                            sizes="(max-width: 768px) 90vw, 45vw"
                                        />
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        ))
                    ) : (
                        <CarouselItem>
                             <Card className='overflow-hidden rounded-lg shadow-lg'>
                                <CardContent className="p-0 flex aspect-[4/5] items-center justify-center bg-muted">
                                    <Image
                                        src="https://placehold.co/800x1000/EFEFEF/333333?text=Sin+Imagen"
                                        alt="Imagen no disponible"
                                        width={800}
                                        height={1000}
                                        className="object-cover w-full h-full"
                                    />
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    )}
                </CarouselContent>
                {product.images && product.images.length > 1 && (
                    <>
                        <CarouselPrevious className='left-3 top-1/2 -translate-y-1/2' />
                        <CarouselNext className='right-3 top-1/2 -translate-y-1/2'/>
                    </>
                )}
            </Carousel>
        </div>

        {/* Columna de Información del Producto */}
        <div className="flex flex-col">
          <h1 className="text-3xl lg:text-4xl font-bold font-headline leading-tight">{product.name}</h1>
          
          <div className="mt-4">
            {product.salePrice ? (
                <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold text-primary">${product.salePrice.toLocaleString('es-AR')}</p>
                <p className="text-2xl text-muted-foreground line-through">${product.price.toLocaleString('es-AR')}</p>
                </div>
            ) : (
                <p className="text-4xl font-bold text-primary">${product.price.toLocaleString('es-AR')}</p>
            )}
          </div>

            <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600"/>
                <p className="text-green-800 font-semibold text-sm">10% de descuento pagando con Efectivo (solo para Retiro por el local)</p>
            </div>

          <Separator className="my-6"/>

          <div className="space-y-6">
            <div className="flex items-center gap-2">
                {hasStock ? (
                    <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-green-600">En Stock</span>
                        {product.stock <= 5 && <Badge variant="destructive" className="animate-pulse">¡Últimas {product.stock} unidades!</Badge>}
                    </>
                ) : (
                    <>
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span className="font-semibold text-red-600">Sin Stock</span>
                    </>
                )}
            </div>

            {hasStock && (
                <div className="w-full">
                    <p className="text-sm font-medium mb-2">CANTIDAD</p>
                    <AddToCartButton product={product} />
                </div>
            )}
          </div>

          <Separator className="my-6"/>

          {/* Medios de envío y retiro */}
          <div className='space-y-4'>
            <h3 className="text-lg font-semibold">Metodos de envío</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-lg flex items-center gap-2"><Home className="h-5 w-5"/> Retiro en nuestro local</h4>
                    <div className="mt-2">
                        <p className="font-bold">Punto de retiro</p>
                        <p className="text-sm text-muted-foreground">La Rioja 416, Catamarca</p>
                        <p className="text-xs mt-2 text-muted-foreground">Con compra on line previa. Te confirmaremos por WhatsApp que está listo para retirar.</p>
                    </div>
                </div>
                <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-lg flex items-center gap-2"><Truck className="h-5 w-5"/> Calcular envío</h4>
                    <ShippingCalculator />
                </div>
            </div>
          </div>

          <div className='mt-6 text-sm text-muted-foreground flex items-center gap-2'>
             <Info className="h-4 w-4"/>
             <LiveVisitorCounter />
           </div>
        </div>
      </div>
      
      {relatedProducts.length > 0 && (
        <section className="space-y-8 pt-8">
            <Separator />
            <div className="text-center">
                <h2 className="text-3xl font-headline font-bold">También te podrían interesar</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </section>
      )}
    </div>
  );
}
