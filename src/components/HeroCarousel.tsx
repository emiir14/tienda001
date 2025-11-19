
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import Autoplay from "embla-carousel-autoplay"


export function HeroCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  )

  const carouselSlides = [
    {
        image: "https://images.augustman.com/wp-content/uploads/sites/2/2022/10/18172157/BURBERRY_BEAUTY_2022_FRAGRANCE_HERO_EDP_STILL_LIFE_JPG_RGB_08_16x9-min-scaled.jpg",
        title: "Elegancia Atemporal",
        description: "Descubre piezas únicas que cuentan una historia. Joyería artesanal para el alma moderna.",
        buttonText: "Ver Colección",
        buttonLink: "/tienda",
        aiHint: "luxury perfume bottle",
    },
    {
        image: "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTA5L3Jhd3BpeGVsb2ZmaWNlNl9waG90b19vZl9taW5pbWFsX21lbl9wZXJmdW1lX2JvdHRsZV9vbl9zYW5kX2hpbF8wN2FkN2UzYy03NWEyLTQzZDQtYTc1Yi00MGM5ZmU5NTgxY2UucG5n.png",
        title: "Ofertas Exclusivas",
        description: "Aprovecha descuentos de hasta 20% en fragancias seleccionadas. ¡No te lo pierdas!",
        buttonText: "Comprar Ahora",
        buttonLink: "/tienda",
        aiHint: "perfume on sand",
    }
  ];

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    const onSelect = () => {
        setCurrent(api.selectedScrollSnap());
    };

    const onInteraction = () => {
        plugin.current.reset();
    };

    api.on("select", onSelect);
    api.on("pointerDown", onInteraction);


    return () => {
      api.off("select", onSelect);
      api.off("pointerDown", onInteraction);
    };
  }, [api]);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  return (
    <div>
        <Carousel 
            setApi={setApi} 
            opts={{ loop: true }} 
            plugins={[plugin.current]}
            className="w-full"
        >
            <CarouselContent>
                {carouselSlides.map((slide, index) => (
                    <CarouselItem key={index}>
                    <div className="relative text-center h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-4">
                        <div className="absolute inset-0 z-0">
                        <Image
                            src={slide.image}
                            alt={slide.title}
                            fill
                            className="object-cover"
                            data-ai-hint={slide.aiHint}
                            priority={index === 0}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20"></div>
                        </div>
                        <div className="relative z-10 text-white max-w-4xl mx-auto">
                        <h1 className="text-5xl font-headline font-bold sm:text-6xl lg:text-7xl drop-shadow-lg">
                            {slide.title}
                        </h1>
                        <p className="mt-4 text-lg text-slate-100 drop-shadow-md">
                            {slide.description}
                        </p>
                        <Button asChild size="lg" className="mt-8 shadow-lg">
                            <Link href={slide.buttonLink}>{slide.buttonText}</Link>
                        </Button>
                        </div>
                    </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20" />
        </Carousel>
        <div className="flex justify-center items-center gap-2 mt-4">
            {carouselSlides.map((_, index) => (
            <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                current === index ? 'w-4 bg-primary' : 'bg-muted-foreground/50 hover:bg-muted-foreground'
                )}
                aria-label={`Ir a la diapositiva ${index + 1}`}
            />
            ))}
        </div>
    </div>
  );
}
