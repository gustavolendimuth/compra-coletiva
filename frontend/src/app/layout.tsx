import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://compracoletiva.app'),
  title: {
    default: 'Compra Coletiva - Organize suas compras em grupo',
    template: '%s | Compra Coletiva',
  },
  description:
    'Plataforma para organizar compras coletivas de forma simples e eficiente. Crie campanhas, gerencie produtos, pedidos e distribuição de frete.',
  keywords: [
    'compra coletiva',
    'compras em grupo',
    'economia compartilhada',
    'frete compartilhado',
    'organização de compras',
  ],
  authors: [{ name: 'Compra Coletiva' }],
  creator: 'Compra Coletiva',
  publisher: 'Compra Coletiva',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://compracoletiva.app',
    siteName: 'Compra Coletiva',
    title: 'Compra Coletiva - Organize suas compras em grupo',
    description:
      'Plataforma para organizar compras coletivas de forma simples e eficiente.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Compra Coletiva',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compra Coletiva - Organize suas compras em grupo',
    description:
      'Plataforma para organizar compras coletivas de forma simples e eficiente.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here
    // google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
