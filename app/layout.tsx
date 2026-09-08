import type {Metadata} from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Sports Review',
  description: 'SaaS B2B2C de automação de vídeo esportivo e gerenciamento Edge.',
  icons: {
    icon: '/logo-icon.svg',
    shortcut: '/logo-icon.svg',
    apple: '/logo-icon.svg',
  },
  openGraph: {
    title: 'Sports Review',
    description: 'SaaS B2B2C de automação de vídeo esportivo e gerenciamento Edge.',
    type: 'website',
    images: ['/logo.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sports Review',
    description: 'SaaS B2B2C de automação de vídeo esportivo e gerenciamento Edge.',
    images: ['/logo.svg'],
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable} ${sora.variable}`}>
      <head>
      </head>
      <body className="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen selection:bg-orange-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

