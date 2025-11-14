"use client";

import { useCart } from "@/hooks/use-cart";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { Toaster } from "@/components/ui/toaster";

// Este es un Componente de Cliente puro.
// Su única responsabilidad es manejar la lógica de UI que depende de hooks.
export function LayoutClient({ children }: { children: React.ReactNode }) {
    const { isSidebarOpen } = useCart();

    return (
        <div className="relative flex min-h-dvh flex-col bg-background/80 backdrop-blur-sm">
            <TopBar />
            <Header />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
            <CartSidebar />
            {/* Lógica condicional: El botón de WhatsApp solo se muestra si el sidebar NO está abierto */}
            {!isSidebarOpen && <WhatsAppButton />}
            <ScrollToTopButton />
            <Toaster />
        </div>
    );
}
