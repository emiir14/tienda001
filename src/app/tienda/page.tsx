
import { Suspense } from 'react';
import { getProducts } from '@/lib/data/products';
import { getCategories } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import { Percent, Tag, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TiendaPageClient } from './TiendaPageClient';

async function TiendaContent() {
  const products = await getProducts();
  const categories = await getCategories();
  const offerProducts = products.filter(p => p.salePrice && p.salePrice > 0);

  return (
    <TiendaPageClient
      allProducts={products}
      allCategories={categories}
      offerProducts={offerProducts}
    />
  );
}

export default function TiendaPage() {
  return (
    <Suspense fallback={<TiendaSkeleton />}>
      <TiendaContent />
    </Suspense>
  );
}

function TiendaSkeleton() {
  return (
    <div className="space-y-12">
      <section className="text-center bg-secondary/50 p-8 rounded-lg">
        <div className="flex justify-center items-center gap-4">
          <Percent className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-headline font-bold text-foreground sm:text-5xl">
            Ofertas Especiales
          </h1>
        </div>
        <p className="mt-2 max-w-2xl mx-auto text-lg text-muted-foreground">
          ¡Aprovecha nuestros descuentos exclusivos por tiempo limitado!
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      </section>

      <Separator />

      <section className="space-y-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center items-center gap-4">
            <Tag className="w-10 h-10 text-primary" />
            <h2 className="text-4xl font-headline font-bold">Todos los Productos</h2>
          </div>
          <div className="relative w-full max-w-lg mx-auto">
             <Skeleton className="h-10 w-full pl-10" />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      </section>
    </div>
  );
}
