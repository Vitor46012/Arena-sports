import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sports Review',
  description: 'SaaS B2B2C de automação de vídeo esportivo e gerenciamento Edge.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen selection:bg-orange-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

