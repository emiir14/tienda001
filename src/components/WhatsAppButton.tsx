
"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { usePathname } from 'next/navigation';

// El SVG ha sido reemplazado por el ícono oficial de WhatsApp
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        {...props}
    >
        <path d="M19.1 4.9C17.2 3 14.7 2 12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.6 1.4 5.1L2 22l5.3-1.4c1.5.8 3.2 1.3 4.8 1.3h.1c5.5 0 10-4.5 10-10c0-2.7-1.1-5.2-2.9-7.1zM12 20.1c-1.6 0-3.2-.5-4.5-1.4l-.3-.2-3.3 1 1-3.2-.2-.3c-1-1.3-1.5-2.9-1.5-4.6 0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8zm4.4-5.8c-.3-.1-1.6-.8-1.8-1-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8 1-.1.2-.2.2-.4.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.2.4-.3.1-.1.2-.2.2-.4.1-.1.1-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-1 1.9-.2 1.2 0 2.3.1 2.5.2.2 1.7 2.6 4.1 3.6.6.2 1.1.4 1.5.5.6.2 1.1.1 1.5.1.4-.1 1.2-.5 1.4-.9.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.6-.3z"/>
    </svg>
);


export default function WhatsAppButton() {
    const pathname = usePathname();

    // No renderizar el botón en las páginas de administrador
    if (pathname.startsWith('/admin')) {
        return null;
    }

    // Reemplaza con tu número de teléfono real y un mensaje predefinido
    const phoneNumber = "5491122334455"; 
    const message = "¡Hola! Estoy interesado en uno de sus productos y me gustaría recibir más información.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        asChild
                        variant="default"
                        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center"
                    >
                        <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp">
                            <WhatsAppIcon className="h-8 w-8"/>
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
