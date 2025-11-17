
"use client";

import { useState, useMemo, useEffect, KeyboardEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard';
import { Separator } from '@/components/ui/separator';
import { Percent, Tag, Search, ListFilter, ChevronRight } from 'lucide-react';
import type { Product, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { GlobalSearch } from '@/components/GlobalSearch';

// Helper function to build search query
const buildSearchQuery = (params: URLSearchParams) => {
  const search = params.toString();
  return search ? `?${search}` : "";
};

interface TiendaPageClientProps {
  allProducts: Product[];
  allCategories: Category[];
  offerProducts: Product[];
}

// Definimos un tipo extendido para las categorías con hijos
type CategoryWithChildren = Category & { children: Category[] };

interface SidebarContentProps {
  isMobile: boolean;
  accordionValue: string | undefined;
  onAccordionChange: (value: string | undefined) => void;
  pendingMinPrice: string;
  setPendingMinPrice: (value: string) => void;
  pendingMaxPrice: string;
  setPendingMaxPrice: (value: string) => void;
  handlePriceFilterApply: () => void;
  activeCategory: string;
  categoryTree: CategoryWithChildren[];
  handleCategoryClick: (id: string) => void;
  allProducts: Product[];
}

const SidebarContent = ({ 
  accordionValue,
  onAccordionChange,
  pendingMinPrice,
  setPendingMinPrice,
  pendingMaxPrice,
  setPendingMaxPrice,
  handlePriceFilterApply,
  activeCategory,
  categoryTree,
  handleCategoryClick,
  allProducts
}: SidebarContentProps) => {

  // Bloquea la escritura de caracteres no deseados en los inputs de tipo number
  const handleNumericKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (['e', 'E', '+', '-'].includes(e.key)) {
          e.preventDefault();
      }
  };

  return (
    <Card>
        <CardHeader><CardTitle className='flex items-center gap-2'><ListFilter className="w-5 h-5"/> Filtros</CardTitle></CardHeader>
        <CardContent className="space-y-6">
            {/* Mobile-only Search Filter (Reutilizando GlobalSearch) */}
            <div className="block lg:hidden space-y-4">
                <h3 className="font-semibold">Buscar</h3>
                <GlobalSearch allProducts={allProducts} />
            </div>
            <div className="block lg:hidden"><Separator/></div>

            {/* Price Filter */}
            <div className="space-y-4">
                <h3 className="font-semibold">Rango de Precios</h3>
                <div className='flex gap-2 items-center'>
                    <Input type="number" placeholder='Desde' value={pendingMinPrice} onChange={(e) => setPendingMinPrice(e.target.value)} onKeyDown={handleNumericKeyDown} aria-label="Precio mínimo" />
                    <span>-</span>
                    <Input type="number" placeholder='Hasta' value={pendingMaxPrice} onChange={(e) => setPendingMaxPrice(e.target.value)} onKeyDown={handleNumericKeyDown} aria-label="Precio máximo" />
                </div>
                <Button onClick={handlePriceFilterApply} className='w-full'>Aplicar Precio</Button>
            </div>
            <Separator />

            {/* Category Filter */}
            <Accordion type="single" collapsible value={accordionValue} onValueChange={onAccordionChange} className="w-full">
                <AccordionItem value="categories">
                    <AccordionTrigger className="bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-md text-base font-semibold text-white">
                        Categorías
                    </AccordionTrigger>
                    <AccordionContent>
                        <nav className="space-y-1 pt-4">
                            <button onClick={() => handleCategoryClick('All')} className={cn("w-full text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors", activeCategory === 'All' ? 'bg-primary/10 text-primary' : 'hover:bg-accent/50')}>Todos los Productos</button>
                            {categoryTree.map((parentCat: CategoryWithChildren) => (
                                <div key={parentCat.id}>
                                    <h4 className="px-3 pt-2 text-sm font-bold text-muted-foreground">{parentCat.name}</h4>
                                    <div className='pl-2'>
                                    {parentCat.children.map((category: Category) => (
                                        <button key={category.id} onClick={() => handleCategoryClick(String(category.id))} className={cn("w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2", activeCategory === String(category.id) ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-accent/50')}><ChevronRight className="w-3 h-3" />{category.name}</button>
                                    ))}
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
    </Card>
  );
}

export function TiendaPageClient({ allProducts, allCategories, offerProducts }: TiendaPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const activeCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('q') || '';
  const activeMinPrice = searchParams.get('minPrice') || '';
  const activeMaxPrice = searchParams.get('maxPrice') || '';

  const [pendingMinPrice, setPendingMinPrice] = useState<string>(activeMinPrice);
  const [pendingMaxPrice, setPendingMaxPrice] = useState<string>(activeMaxPrice);
  const [accordionValue, setAccordionValue] = useState<string | undefined>();

  useEffect(() => {
    setAccordionValue(isMobile ? undefined : 'categories');
  }, [isMobile]);

  useEffect(() => {
    const minP = searchParams.get('minPrice') || '';
    const maxP = searchParams.get('maxPrice') || '';
    
    if (minP !== pendingMinPrice) setPendingMinPrice(minP);
    if (maxP !== pendingMaxPrice) setPendingMaxPrice(maxP);

  }, [searchParams]);

  const { categoryTree } = useMemo(() => {
    const tree: CategoryWithChildren[] = [];
    const map = new Map<number, CategoryWithChildren>();
    const items: CategoryWithChildren[] = allCategories.map(category => ({ ...category, children: [] }));
    items.forEach(category => map.set(category.id, category));
    items.forEach(category => {
        if (category.parentId) {
            map.get(category.parentId)?.children.push(category);
        } else {
            tree.push(category);
        }
    });
    return { categoryTree: tree };
  }, [allCategories]);

  const updateURL = (params: URLSearchParams) => {
    const query = buildSearchQuery(params);
    router.push(`/tienda${query}#products-grid`, { scroll: false });
  };

  const handleCategoryClick = (categoryId: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (categoryId === 'All') current.delete('category'); else current.set('category', categoryId);
    updateURL(current);
  };
  
  const handlePriceFilterApply = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (pendingMinPrice) current.set('minPrice', pendingMinPrice); else current.delete('minPrice');
    if (pendingMaxPrice) current.set('maxPrice', pendingMaxPrice); else current.delete('maxPrice');
    updateURL(current);
  };

  const filteredProducts = useMemo(() => {
    let items = allProducts;
    const min = parseFloat(activeMinPrice);
    const max = parseFloat(activeMaxPrice);
    if (searchQuery) {
        const searchTokens = searchQuery.toLowerCase().split(' ').filter(t => t.length > 0);
        const matchingCategoryIds = new Set(allCategories.filter(c => searchTokens.every(t => c.name.toLowerCase().includes(t))).map(c => c.id));
        items = items.filter(p => {
            const productName = p.name.toLowerCase();
            const productDesc = p.shortDescription?.toLowerCase() || '';
            return searchTokens.every(t => productName.includes(t) || productDesc.includes(t) || p.categoryIds.some(cId => matchingCategoryIds.has(cId)));
        });
    }
    if (activeCategory !== 'All') {
        const catId = Number(activeCategory);
        items = items.filter(p => p.categoryIds.includes(catId));
    }
    if (!isNaN(min)) items = items.filter(p => (p.salePrice ?? p.price) >= min);
    if (!isNaN(max) && max > 0) items = items.filter(p => (p.salePrice ?? p.price) <= max);
    return items;
  }, [allProducts, searchQuery, activeCategory, activeMinPrice, activeMaxPrice, allCategories]);

  return (
    <div className="space-y-12">
        <section className="text-center bg-secondary/50 p-8 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
              <Percent className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-headline font-bold text-foreground sm:text-5xl">
                  Ofertas Especiales
              </h1>
            </div>
            <p className="mt-2 max-w-2xl mx-auto text-lg text-muted-foreground">
                ¡Aprovecha nuestros descuentos exclusivos por tiempo limitado!
            </p>
            {offerProducts.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">{offerProducts.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="mt-8 text-muted-foreground">No hay ofertas especiales en este momento.</p>}
        </section>
        <Separator />
        <section id="products-grid" className="scroll-mt-24">
            <div className="text-center mb-10">
                <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
                    <Tag className="w-10 h-10 text-primary" />
                    <h2 className="text-4xl font-headline font-bold text-center">Todos los Productos</h2>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start px-4 sm:px-6 lg:px-0">
                <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
                  <SidebarContent 
                    isMobile={isMobile}
                    accordionValue={accordionValue}
                    onAccordionChange={setAccordionValue}
                    pendingMinPrice={pendingMinPrice}
                    setPendingMinPrice={setPendingMinPrice}
                    pendingMaxPrice={pendingMaxPrice}
                    setPendingMaxPrice={setPendingMaxPrice}
                    handlePriceFilterApply={handlePriceFilterApply}
                    activeCategory={activeCategory}
                    categoryTree={categoryTree}
                    handleCategoryClick={handleCategoryClick}
                    allProducts={allProducts}
                  />
                </aside>
                <main className="lg:col-span-3">
                    {filteredProducts.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <Card className="text-center py-24 col-span-full"><CardContent><Search className="w-16 h-16 mx-auto text-muted-foreground" /><p className="mt-4 text-xl font-semibold text-muted-foreground">No se encontraron productos</p><p className="text-muted-foreground mt-2">Intenta ajustar tus filtros de búsqueda.</p></CardContent></Card>}
                </main>
            </div>
        </section>
    </div>
  );
}
