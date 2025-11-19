
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import Script from 'next/script';
import { LayoutClient } from '@/components/LayoutClient'; // Importamos el nuevo componente cliente

// El layout principal es un Componente de Servidor.
// Aquí se define la metadata global..
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
            {/* CartProvider envuelve a LayoutClient para que este último tenga acceso al contexto */}
            <CartProvider>
                <LayoutClient>{children}</LayoutClient>
            </CartProvider>
        </ThemeProvider>
        
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
