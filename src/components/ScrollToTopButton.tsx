
"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Only render the button on admin pages
  if (!pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <Button
      onClick={scrollToTop}
      className={cn(
        'fixed bottom-4 right-4 rounded-full w-12 h-12 shadow-lg transition-opacity z-50',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      variant="default"
      size="icon"
      aria-label="Volver arriba"
    >
      <ArrowUp className="h-6 w-6" />
    </Button>
  );
}
