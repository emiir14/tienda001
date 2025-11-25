"use client";

import { useCart } from "@/hooks/use-cart";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from "next/navigation";

export function LayoutClient({ children }: { children: React.ReactNode }) {
    const { isSidebarOpen } = useCart();
    const pathname = usePathname();
    const isAdminPage = pathname.startsWith('/admin');

    return (
        // Usamos un Fragmento de React (<>) para tener múltiples elementos raíz
        <>
            {/* Este div contiene el flujo principal de la página y el efecto de desenfoque */}
            <div className="relative flex min-h-dvh flex-col bg-background/80 backdrop-blur-sm">
                <TopBar />
                <Header />
                <main className="flex-1">
                    {children}
                </main>
                <Footer />
            </div>

            {/* Estos componentes están FUERA del div con backdrop-blur, 
                por lo que su 'position: fixed' funcionará correctamente */}
            <CartSidebar />
            <Toaster />
            <ScrollToTopButton />
            
            {/* La lógica condicional para el botón de WhatsApp se mantiene */}
            {!isSidebarOpen && !isAdminPage && <WhatsAppButton />}
        </>
    );
}
