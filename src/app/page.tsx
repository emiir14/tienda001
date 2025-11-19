
import { getProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { HeroCarousel } from "@/components/HeroCarousel";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, MessageSquareQuote, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Revalidar la página cada hora para mantener la frescura de los datos
export const revalidate = 3600;

export default async function HomePage() {
    const allProducts = await getProducts();
    const featuredProducts = allProducts.filter(p => p.featured);
    const offerProducts = allProducts.filter(p => p.salePrice && p.salePrice > 0);

    const benefits = [
        {
            icon: Truck,
            title: "Envíos a Todo el País",
            description: "Recibe tus joyas en la comodidad de tu hogar, sin importar dónde te encuentres.",
            bgColor: "bg-blue-100",
            iconColor: "text-blue-600"
        },
        {
            icon: ShieldCheck,
            title: "Garantía de Calidad",
            description: "Cada pieza está elaborada con materiales de primera y un cuidado excepcional.",
            bgColor: "bg-green-100",
            iconColor: "text-green-600"
        },
        {
            icon: MessageSquareQuote,
            title: "Asesoramiento Personalizado",
            description: "Te ayudamos a encontrar la joya perfecta que exprese tu estilo único.",
            bgColor: "bg-yellow-100",
            iconColor: "text-yellow-600"
        }
    ];
    
    return (
        <div className="space-y-16 sm:space-y-24">
            
            {/* Hero Section */}
            <section>
                <HeroCarousel />
            </section>

            {/* Featured Products Section */}
            {featuredProducts.length > 0 && (
                <section>
                    <div className="text-center space-y-2 mb-10">
                        <h2 className="text-4xl font-headline font-bold">Productos Destacados</h2>
                        <p className="text-lg text-muted-foreground">Una selección de nuestras piezas más deseadas.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {featuredProducts.slice(0, 4).map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <Button asChild size="lg" className="shadow-md">
                            <Link href="/tienda">Ver Todos los Productos <ArrowRight className="ml-2 w-5 h-5" /></Link>
                        </Button>
                    </div>
                </section>
            )}

            <Separator />

            {/* About Us Section */}
            <section className="bg-muted/30 -mx-4 sm:-mx-12 md:-mx-24 px-4 sm:px-12 md:px-24 py-16 sm:py-24">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 text-center lg:text-left">
                        <h2 className="text-4xl font-headline font-bold">Sobre Nosotros</h2>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                            En Osadía entendemos la joyería como un lenguaje visual que transmite identidad y estilo. Nuestra marca nace de la unión entre diseño contemporáneo y una mirada minimalista, creando piezas que equilibran simplicidad, precisión y una fuerte carga simbólica.
                        </p>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                            Trabajamos con materiales de alta calidad para lograr joyas versátiles y modernas. Cada pieza está pensada para acompañar distintos momentos y proyectar una identidad clara y elegante. En Osadía, cada diseño inspira y perdura.
                        </p>
                        <div className='flex flex-wrap gap-4 pt-4 justify-center lg:justify-start'>
                            <Button asChild className="shadow-md" size="lg">
                                <Link href="/tienda">Explorar Colección</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/pages/preguntas-frecuentes">Saber Más</Link>
                            </Button>
                        </div>
                    </div>
                    <div className="relative h-80 lg:h-[28rem] rounded-xl overflow-hidden shadow-2xl order-first lg:order-last">
                        <Image
                            src="https://images.unsplash.com/photo-1611652022417-a04036e4281c?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Sobre Nosotros"
                            layout="fill"
                            objectFit="cover"
                            className="transition-transform duration-500 hover:scale-105"
                        />
                    </div>
                </div>
            </section>

            <Separator />
            
            {/* Benefits Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-2 mb-12">
                    <h2 className="text-4xl font-headline font-bold">¿Por Qué Elegir Osadía?</h2>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Creemos que una joya es más que un accesorio, es una declaración. Por eso, te ofrecemos una experiencia de compra única.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {benefits.map((benefit, index) => (
                        <div key={index} className={cn("p-8 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1", benefit.bgColor)}>
                            <div className={cn("inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-white shadow-md", benefit.iconColor)}>
                                <benefit.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-800">{benefit.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    );
}
