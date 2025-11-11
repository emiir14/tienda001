
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/contexts/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import WhatsAppButton from '@/components/WhatsAppButton';
import Script from 'next/script';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import CartSidebar from '@/components/CartSidebar';
import TopBar from '@/components/TopBar';

export const metadata: Metadata = {
  title: 'Joya - Elegancia Atemporal',
  description: 'Una simple tienda de e-commerce con recomendaciones de IA.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fino+Sans&family=Madeleina+Sans&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <CartProvider>
              <div className="relative flex min-h-dvh flex-col bg-background/80 backdrop-blur-sm">
                <TopBar />
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
              <CartSidebar />
              <WhatsAppButton />
              <ScrollToTopButton />
              <Toaster />
            </CartProvider>
        </ThemeProvider>
        
        {/* Hotjar Tracking Code - Replace 'YOUR_SITE_ID' with your actual Site ID */}
        <Script id="hotjar-integration" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:'YOUR_SITE_ID',hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      </body>
    </html>
  );
}
