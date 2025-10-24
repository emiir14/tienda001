
"use client";

import Link from 'next/link';
import { ShoppingCart, Menu, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo, forwardRef, Suspense } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { ThemeToggle } from './ThemeToggle';
import React from 'react';
import { cn } from '@/lib/utils';
import { getCategories, getProducts } from '@/lib/data';
import type { Category, Product } from '@/lib/types';
import { GlobalSearch } from './GlobalSearch';
import { Skeleton } from './ui/skeleton';

const ListItem = forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground group-hover:text-accent-foreground/80">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
});
ListItem.displayName = "ListItem"


export default function Header() {
  const { cartCount, setIsSidebarOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchData() {
        try {
            const [fetchedCategories, fetchedProducts] = await Promise.all([
              getCategories(),
              getProducts()
            ]);
            setCategories(fetchedCategories);
            setProducts(fetchedProducts);
        } catch (error) {
            console.error("Failed to fetch data for header:", error);
        }
    }
    fetchData();
  }, []);

  const { categoryTree, categoryMap } = useMemo(() => {
    const tree: (Category & { children: Category[] })[] = [];
    const map = new Map<number, Category & { children: Category[] }>();

    const items = categories.map(category => ({ ...category, children: [] as Category[] }));
    
    items.forEach(category => {
        map.set(category.id, category);
    });

    items.forEach(category => {
        if (category.parentId) {
            const parent = map.get(category.parentId);
            if (parent) {
                parent.children.push(category);
            }
        } else {
            tree.push(category);
        }
    });

    return { categoryTree: tree, categoryMap: map };
  }, [categories]);

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/#about', label: 'Sobre Nosotros' },
  ];
  
  const infoLinks = [
    { href: '/pages/garantia', title: 'Garantía', description: 'Conoce nuestras políticas de garantía.' },
    { href: '/pages/preguntas-frecuentes', title: 'Preguntas Frecuentes', description: 'Encuentra respuestas a tus dudas.' },
    { href: '/pages/como-comprar', title: 'Cómo Comprar', description: 'Guía paso a paso para tu compra.' },
  ];
  
  const MegaMenuContent = () => {
    const mainCategories = categoryTree;
    const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
    
    useEffect(() => {
        if (mainCategories.length > 0 && !hoveredCategory) {
            setHoveredCategory(mainCategories[0].id);
        }
    }, [mainCategories, hoveredCategory]);

    const activeSubcategories = useMemo(() => {
        if (!hoveredCategory) return [];
        const category = categoryMap.get(hoveredCategory);
        return category?.children ?? [];
    }, [hoveredCategory, categoryMap]);
    
    if (mainCategories.length === 0) return null;

    return (
        <NavigationMenuContent>
            <div className="grid grid-cols-[1fr_2fr] w-[600px] lg:w-[800px] p-4">
                <div className="border-r pr-4">
                     <div className="pb-3 mb-2 border-b">
                        <NavigationMenuLink asChild>
                            <Link href="/tienda" className="font-semibold text-lg p-3 block hover:text-primary">
                                Ver toda la Tienda
                            </Link>
                        </NavigationMenuLink>
                     </div>
                     <ul className="flex flex-col">
                        {mainCategories.map(cat => (
                            <li key={cat.id} onMouseEnter={() => setHoveredCategory(cat.id)} >
                                <NavigationMenuLink asChild>
                                    <Link 
                                        href={`/tienda?category=${cat.id}#products-grid`}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-md p-3 text-sm font-medium no-underline transition-colors hover:bg-accent hover:text-accent-foreground", 
                                            hoveredCategory === cat.id && "bg-accent text-accent-foreground"
                                        )}
                                    >
                                        {cat.name}
                                        {cat.children.length > 0 && <ChevronRight className="h-4 w-4" />}
                                    </Link>
                                </NavigationMenuLink>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-4 pl-6">
                    {hoveredCategory && (
                        <>
                            <h3 className="font-bold text-lg mb-2">
                                {categoryMap.get(hoveredCategory)?.name}
                            </h3>
                            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {activeSubcategories.length > 0 ? activeSubcategories.map(sub => (
                                <li key={sub.id}>
                                    <NavigationMenuLink asChild>
                                        <Link href={`/tienda?category=${sub.id}#products-grid`} className="block rounded-md p-2 text-sm hover:bg-accent hover:text-accent-foreground">
                                            {sub.name}
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                            )) : (
                                <li className="text-sm text-muted-foreground col-span-2 p-2">No hay subcategorías.</li>
                            )}
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </NavigationMenuContent>
    );
};

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold font-headline text-xl">Joya</span>
          </Link>
           <NavigationMenu>
            <NavigationMenuList>
                {navLinks.map(link => (
                    <NavigationMenuItem key={link.label}>
                      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link href={link.href}>
                          {link.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                ))}
                                
                <NavigationMenuItem>
                    <NavigationMenuTrigger>
                        <Link href="/tienda">Tienda</Link>
                    </NavigationMenuTrigger>
                    <MegaMenuContent/>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuTrigger>Información</NavigationMenuTrigger>
                    <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] lg:w-[600px]">
                        {infoLinks.map((link) => (
                           <ListItem key={link.title} href={link.href} title={link.title}>
                                {link.description}
                           </ListItem>
                       ))}
                    </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Abrir menú</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className='w-full max-w-[300px]'>
                <SheetHeader>
                    <SheetTitle>
                        <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                            <span className="font-bold font-headline text-2xl">Joya</span>
                        </Link>
                    </SheetTitle>
                </SheetHeader>
                <div className='p-4'>
                    <Suspense fallback={<Skeleton className="h-10 w-full" />}>
                        <GlobalSearch allProducts={products} />
                    </Suspense>
                </div>
                <nav className="flex flex-col gap-6 p-4 text-lg mt-4">
                    {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors">
                        {link.label}
                    </Link>
                    ))}
                     <Link href="/tienda" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors">
                        Tienda
                    </Link>
                    {infoLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors">
                        {link.title}
                    </Link>
                    ))}
                </nav>
            </SheetContent>
            </Sheet>
        </div>
        
        {/* Centered Title on Mobile */}
        <div className="flex-1 flex justify-center items-center md:hidden">
             <Link href="/" className="flex items-center space-x-2">
                <span className="font-bold font-headline text-xl">Joya</span>
             </Link>
        </div>

        <div className="flex items-center justify-end space-x-1 md:flex-1">
          <div className="hidden md:block w-full max-w-sm mr-4">
            <Suspense fallback={<Skeleton className="h-10 w-full" />}>
              <GlobalSearch allProducts={products} />
            </Suspense>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} aria-label="Carrito de compras">
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </div>
          </Button>
        </div>
      </div>
    </header>
  );
}
