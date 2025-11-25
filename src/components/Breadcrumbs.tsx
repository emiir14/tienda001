
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

// AHORA: Esta hardcodeado, idealmente se deberia construir dinamicamente
export const Breadcrumbs = () => {
    return (
        <nav className="flex items-center text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-primary">Inicio</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href="/tienda" className="hover:text-primary">Tienda</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-foreground">Producto</span>
        </nav>
    );
}
