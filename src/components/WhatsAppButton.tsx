
import { Button } from "./ui/button";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"


const WhatsAppButton = () => {
    const defaultMessage = "¡Hola! Estoy interesado en uno de sus productos.";
    const encodedMessage = encodeURIComponent(defaultMessage);
    const whatsappUrl = `https://wa.me/5491122334455?text=${encodedMessage}`;

    return (
        <div className="hidden md:block">
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            asChild
                            variant="default"
                            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center [&_svg]:h-8 [&_svg]:w-8"
                        >
                            <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                <FaWhatsapp /> 
                                <span className="sr-only">Contactar por WhatsApp</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-foreground text-background">
                        <p>¿Necesitas ayuda? ¡Contáctanos!</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};

export default WhatsAppButton;
