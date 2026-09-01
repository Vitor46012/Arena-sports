import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sports Review',
  description: 'SaaS B2B2C de automação de vídeo esportivo e gerenciamento Edge.',
  openGraph: {
    title: 'Sports Review',
    description: 'SaaS B2B2C de automação de vídeo esportivo e gerenciamento Edge.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sports Review',
    description: 'SaaS B2B2C de automação de vídeo esportivo e gerenciamento Edge.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen selection:bg-orange-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
