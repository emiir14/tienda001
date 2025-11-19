
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
  title: 'Osadía Joyas',
  description: 'Joyas contemporáneas que expresan identidad con simplicidad y elegancia.',
  icons: {
    icon: '/favicon.ico', // <-- Se declara explícitamente el favicon
    shortcut: '/favicon.ico', // <-- Se declara explícitamente el favicon
    apple: '/icon.png', // <-- Se declara explícitamente el favicon
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>
            <LayoutClient>{children}</LayoutClient>
          </CartProvider>
        </ThemeProvider>
        <Script
          src="https://upload-widget.cloudinary.com/global/all.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

