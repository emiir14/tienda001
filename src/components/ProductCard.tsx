
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { Eye, ShoppingCart, Ban } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const hasStock = product.stock > 0;

  const calculateDiscount = () => {
    if (product.salePrice && product.price) {
      return Math.round(((product.price - product.salePrice) / product.price) * 100);
    }
    return 0;
  };

  const discount = calculateDiscount();

  return (
    <Card className={cn(
        "flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700",
        !hasStock && "opacity-50"
    )}>
      <CardHeader className="p-0">
        <Link href={`/products/${product.id}`} className={cn("block relative group", !hasStock && "pointer-events-none")}>
          <div className={cn("w-full aspect-square overflow-hidden", !hasStock && "filter grayscale")}>
            <Image
              src={product.images[0] ?? 'https://placehold.co/600x600.png'}
              alt={product.name}
              width={600}
              height={600}
              className="aspect-square object-cover w-full transition-transform duration-500 group-hover:scale-105"
              data-ai-hint={product.aiHint}
            />
          </div>
          <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.salePrice && <Badge className='shadow-md' variant="destructive">OFERTA</Badge>}
          {discount > 0 && <Badge className='shadow-md' variant="secondary">{`${discount}% OFF`}</Badge>}           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className='p-2 bg-background/80 rounded-full'>
                    <Eye className='text-foreground' />
                </div>
           </div>
           </div>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-4 bg-card">
        <Link href={`/products/${product.id}`} className={cn('group', !hasStock && "pointer-events-none")}>
          <CardTitle className="font-headline text-lg hover:text-primary transition-colors leading-tight">{product.name}</CardTitle>
        </Link>
        {product.shortDescription && <CardDescription className="mt-1 text-sm">{product.shortDescription}</CardDescription>}
        
        {product.salePrice ? (
            <div className='flex items-baseline gap-2 mt-2'>
                <p className="text-2xl font-bold text-primary">
                    ${product.salePrice.toLocaleString('es-AR')}
                </p>
                <p className="text-lg font-medium text-muted-foreground line-through">
                    ${product.price.toLocaleString('es-AR')}
                </p>
            </div>
        ) : (
            <p className="mt-2 text-2xl font-bold text-foreground">
                ${product.price.toLocaleString('es-AR')}
            </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 bg-card">
        <Button onClick={() => addToCart(product)} className="w-full shadow-md" disabled={!hasStock}>
            {hasStock ? <><ShoppingCart className="mr-2 h-4 w-4" /> Añadir al Carrito</> : <><Ban className="mr-2 h-4 w-4" />Sin Stock</>}
        </Button>
      </CardFooter>
    </Card>
  );
}
