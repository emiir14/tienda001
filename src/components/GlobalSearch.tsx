"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export function GlobalSearch({ allProducts }: { allProducts: Product[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedSearchTerm && isFocused) {
      const filtered = allProducts
        .filter(p => p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
        .slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchTerm, allProducts, isFocused]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Syncs the search bar if the user navigates using browser back/forward or loads a search URL
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchTerm.trim()) {
        // If the user submits an empty search, do nothing.
        return;
    }

    const currentQuery = new URLSearchParams(Array.from(searchParams.entries()));
    currentQuery.set('q', searchTerm);
    
    const search = currentQuery.toString();
    const query = search ? `?${search}` : '';
    
    router.push(`/tienda${query}#products-grid`);
    setIsFocused(false);
    setSuggestions([]);
  };

  const handleSuggestionClick = (product: Product) => {
    setSearchTerm('');
    router.push(`/products/${product.id}`);
    setIsFocused(false);
    setSuggestions([]);
  };

  return (
    <div className="relative w-full max-w-sm" ref={searchContainerRef}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <Input
          type="search"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="h-10 w-full rounded-full border-2 border-border focus:border-primary pl-4 pr-10"
          aria-label="Buscar productos"
          autoComplete="off"
        />
        <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full">
            <Search className="h-4 w-4 text-muted-foreground" />
        </Button>
      </form>
      {suggestions.length > 0 && (
        <div className={cn(
            "absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg z-20 overflow-hidden",
            "animate-in fade-in-0 zoom-in-95"
        )}>
          <ul className="py-1">
            {suggestions.map(product => (
              <li key={product.id}>
                <button
                  onClick={() => handleSuggestionClick(product)}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-4"
                >
                    <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0">
                        <Image
                            src={product.images[0] ?? 'https://placehold.co/40x40.png'}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                        />
                    </div>
                  <span className="flex-1">{product.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
