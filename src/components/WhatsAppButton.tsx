
"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa';

export default function WhatsAppButton() {
    const pathname = usePathname();

    // No renderizar el botón en las páginas de administración
    if (pathname.startsWith('/admin')) {
        return null;
    }

    // El número de teléfono ahora se obtiene de una variable de entorno
    const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    const message = "¡Hola! Estoy interesado en uno de sus productos.";

    // No renderizar el botón si no hay número de teléfono configurado
    if (!phoneNumber) {
        return null;
    }

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        asChild
                        variant="default"
                        className="fixed bottom-6 right-6 h-10 w-10 rounded-full shadow-lg z-50 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center"
                    >
                        <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                            <FaWhatsapp size={40}/> 
                            <span className="sr-only">Contactar por WhatsApp</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-foreground text-background">
                    <p>¿Necesitas ayuda?</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
