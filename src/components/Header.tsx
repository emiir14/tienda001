
"use client";

import Link from 'next/link';
import { ShoppingCart, Menu } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { useState, useEffect, Suspense } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { ThemeToggle } from './ThemeToggle';
import { GlobalSearch } from './GlobalSearch';
import { getProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function Header() {
  const { cartCount, setIsSidebarOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    async function fetchData() {
        try {
            const fetchedProducts = await getProducts();
            setProducts(fetchedProducts);
        } catch (error) {
            console.error("Failed to fetch products for search:", error);
        }
    }
    fetchData();

    const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/tienda', label: 'Tienda' },
    { href: '/#about', label: 'Sobre Nosotros' },
    { href: '/pages/garantia', label: 'Garantía' },
    { href: '/pages/preguntas-frecuentes', label: 'Preguntas Frecuentes' },
    { href: '/pages/como-comprar', label: 'Cómo Comprar' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <header className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
        isScrolled ? 'h-16' : 'h-20'
    )}>
      <div className="container flex h-full items-center">
        
        {/* Left Section: Mobile Menu and Search Bar */}
        <div className="flex items-center gap-2 flex-1">
          {/* Mobile Menu - Now visible on all screen sizes */}
          <div>
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
                              <Image src="https://placehold.co/140x50/png?text=OSADÍA" alt="OSADÍA Logo" width={120} height={40} />
                          </Link>
                      </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-6 p-4 text-lg mt-4">
                      {navLinks.map((link) => (
                      <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors">
                          {link.label}
                      </Link>
                      ))}
                  </nav>
              </SheetContent>
              </Sheet>
          </div>
          <div className="hidden md:block w-full max-w-sm">
            <Suspense fallback={<Skeleton className="h-10 w-full" />}>
              <GlobalSearch allProducts={products} />
            </Suspense>
          </div>
        </div>

        {/* Center Section: Logo */}
        <div className="flex-1 flex justify-center">
             <Link href="/" className="flex items-center space-x-2">
                <Image src="https://placehold.co/140x50/png?text=OSADÍA" alt="OSADÍA Logo" width={140} height={50} priority />
             </Link>
        </div>

        {/* Right Section: Icons */}
        <div className="flex items-center justify-end space-x-1 flex-1">
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
