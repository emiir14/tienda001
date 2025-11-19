
import { ProductCard } from '@/components/ProductCard';
import { getProducts } from '@/lib/data/products';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Gem, ArrowRight, Truck, ShieldCheck, MessageSquareQuote } from 'lucide-react';
import { HeroCarousel } from '@/components/HeroCarousel';
import { InstagramIcon } from '@/components/icons/InstagramIcon';

const whyChooseUsFeatures = [
    {
        icon: Truck,
        title: "Envíos a Todo el País",
        description: "Recibe tus joyas en la comodidad de tu hogar, sin importar dónde te encuentres.",
        bgColor: "bg-blue-100/50 dark:bg-blue-900/20",
        iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
        icon: ShieldCheck,
        title: "Garantía de Calidad",
        description: "Cada pieza está elaborada con materiales de primera y un cuidado excepcional.",
        bgColor: "bg-green-100/50 dark:bg-green-900/20",
        iconColor: "text-green-600 dark:text-green-400"
    },
    {
        icon: MessageSquareQuote,
        title: "Asesoramiento Personalizado",
        description: "Te ayudamos a encontrar la joya perfecta que exprese tu estilo único.",
        bgColor: "bg-yellow-100/50 dark:bg-yellow-900/20",
        iconColor: "text-yellow-600 dark:text-yellow-400"
    }
];

export default async function Home() {
    const products: Product[] = await getProducts();
    const featuredProducts = products.filter(p => p.featured).slice(0, 8);

    return (
        <div className="space-y-16">
            {/* Hero Carousel Section - Full Width */}
            <section className="w-full -mx-px">
                 <HeroCarousel />
            </section>

            {/* Container for the rest of the content */}
            <div className="container">
                {/* Featured Products Section */}
                <section id="featured" className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-4xl font-headline font-bold">Productos Destacados</h2>
                        <p className="mt-2 text-muted-foreground">Nuestra selección especial, elegida para ti.</p>
                    </div>
                    {featuredProducts.length > 0 ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {featuredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <p>No hay productos destacados para mostrar.</p>
                        </div>
                    )}
                </section>

                {/* Ver Mas Button */}
                <div className="text-center mt-12">
                    <Button asChild size="lg" className="gap-2 px-10 py-6 text-lg font-semibold tracking-wider shadow-lg transform transition-transform duration-200 hover:scale-105">
                        <Link href="/tienda">
                            Ver Todos los Productos
                            <ArrowRight className='w-6 h-6'/>
                        </Link>
                    </Button>
                </div>

                <Separator className="w-1/2 mx-auto my-8"/>

                {/* Instagram Section - Icon Larger, Text Smaller */}
                <section id="instagram">
                    <div className="flex items-center justify-center gap-8">
                        <Separator className="flex-1" />
                        <div className="text-center flex-shrink-0">
                            <Button asChild variant="ghost" className="group h-auto rounded-full px-5 py-1 text-2xl font-headline text-muted-foreground tracking-wider hover:bg-accent hover:text-accent-foreground transition-colors">
                                <Link href="https://www.instagram.com/osadia.cta" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4">
                                    <InstagramIcon size={112} className="text-muted-foreground transition-colors group-hover:text-[#E1306C]" />
                                    <span>osadia.cta</span>
                                </Link>
                            </Button>
                        </div>
                        <Separator className="flex-1" />
                    </div>
                </section>
                
                <Separator className="w-1/2 mx-auto my-8"/>

                {/* Why Choose Us Section */}
                <section id="why-choose-us" className="space-y-12 py-5">
                    <div className="text-center">
                        <h2 className="text-4xl font-headline font-bold">¿Por Qué Elegir Osadía?</h2>
                        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                            Creemos que una joya es más que un accesorio, es una declaración. Por eso, te ofrecemos una experiencia de compra única.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {whyChooseUsFeatures.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div key={index} className={`p-8 rounded-2xl text-center space-y-4 ${feature.bgColor}`}>
                                    <div className="inline-block p-4 bg-background rounded-full shadow-md">
                                        <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                                    </div>
                                    <h3 className="text-2xl font-bold font-headline">{feature.title}</h3>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <Separator className="w-1/2 mx-auto my-8"/>


                {/* About Us Section */}
                <section id="about" className="grid md:grid-cols-3 gap-12 items-center py-5">
                    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
                         <iframe
                            src="https://maps.google.com/maps?q=La%20Rioja%20416,%20Catamarca,%20Argentina&t=&z=15&ie=UTF8&iwloc=&output=embed"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Ubicación de la tienda"
                            className='grayscale hover:grayscale-0 transition-all duration-500'
                        ></iframe>
                    </div>
                    <div className='space-y-6 md:col-span-2'>
                        <h2 className="text-4xl font-headline font-bold">Sobre Nosotros</h2>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                            En Osadía entendemos la joyería como un lenguaje visual que transmite identidad y estilo. Nuestra marca nace de la unión entre diseño contemporáneo y una mirada minimalista, creando piezas que equilibran simplicidad, precisión y una fuerte carga simbólica.
                        </p>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                            Trabajamos con materiales de alta calidad para lograr joyas versátiles y modernas. Cada pieza está pensada para acompañar distintos momentos y proyectar una identidad clara y elegante. En Osadía, cada diseño inspira y perdura.
                        </p>
                        <div className='flex flex-wrap gap-4 pt-4'>
                             <Button asChild className="shadow-md" size="lg">
                                <Link href="https://www.instagram.com/osadia.cta" target="_blank" rel="noopener noreferrer">
                                    <InstagramIcon className="mr-2" /> Síguenos en Instagram
                                </Link>
                            </Button>
                             <Button asChild variant="outline" className="shadow-md" size="lg">
                                <Link href="/tienda">
                                    <Gem className="mr-2" /> Nuestros Productos
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
