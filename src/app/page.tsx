
import { ProductCard } from '@/components/ProductCard';
import { getProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Instagram, MapPin } from 'lucide-react';
import { HeroCarousel } from '@/components/HeroCarousel';

export default async function Home() {
    const products: Product[] = await getProducts();
    const featuredProducts = products.filter(p => p.featured);

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

                <Separator className="w-1/2 mx-auto my-12"/>

                {/* Instagram Section */}
                <section id="instagram" className="py-4">
                    <div className="flex items-center justify-center gap-8">
                        <Separator className="flex-1" />
                        <div className="text-center space-y-4 flex-shrink-0">
                            <div className="flex justify-center items-center gap-3">
                                <Instagram className="h-7 w-7 text-muted-foreground" />
                                <h3 className="text-3xl font-headline text-muted-foreground tracking-wider">alquimiapiezasdeplata</h3>
                            </div>
                            <Button asChild variant="outline" size="lg" className="rounded-full px-10 py-6 text-lg tracking-widest">
                                <Link href="https://instagram.com/alquimiapiezasdeplata" target="_blank" rel="noopener noreferrer">
                                    SEGUINOS
                                </Link>
                            </Button>
                        </div>
                        <Separator className="flex-1" />
                    </div>
                </section>

                <Separator className="w-1/2 mx-auto my-12"/>

                {/* About Us Section */}
                <section id="about" className="grid md:grid-cols-2 gap-12 items-center py-16">
                    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
                         <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d105073.45344445679!2d-58.503338254488!3d-34.6158237244917!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcca3b4ef90cbd%3A0xa0b3812e88e88e87!2sBuenos%20Aires%2C%20CABA%2C%20Argentina!5e0!3m2!1sen!2sus!4v1718042456479!5m2!1sen!2sus"
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
                    <div className='space-y-6'>
                        <h2 className="text-4xl font-headline font-bold">Sobre Nosotros</h2>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                            En Joya, creemos que cada pieza de joyería es una forma de arte y una expresión personal. Nacimos de la pasión por el diseño y la artesanía, creando joyas que no solo adornan, sino que también inspiran.
                        </p>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                            Utilizamos materiales de la más alta calidad y técnicas tradicionales para dar vida a diseños contemporáneos y atemporales. Cada creación es un tesoro destinado a ser amado por generaciones.
                        </p>
                        <div className='flex flex-wrap gap-4 pt-4'>
                             <Button asChild className="shadow-md" size="lg">
                                <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                                    <Instagram className="mr-2" /> Síguenos en Instagram
                                </Link>
                            </Button>
                             <Button asChild variant="outline" className="shadow-md" size="lg">
                                <Link href="#featured">
                                    <MapPin className="mr-2" /> Nuestros Productos
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
