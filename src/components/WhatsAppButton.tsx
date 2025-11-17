
"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { usePathname } from 'next/navigation';

// Using an inline SVG for the WhatsApp icon to avoid adding another library
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);


export default function WhatsAppButton() {
    const pathname = usePathname();

    // Do not render the button on admin pages
    if (pathname.startsWith('/admin')) {
        return null;
    }

    // Replace with your actual phone number and a pre-filled message
    const phoneNumber = "5491122334455"; 
    const message = "Hola! Estoy interesado en uno de sus productos.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        asChild
                        variant="default"
                        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-green-500 hover:bg-green-600 text-white"
                    >
                        <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                            <WhatsAppIcon className="h-7 w-7"/>
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
