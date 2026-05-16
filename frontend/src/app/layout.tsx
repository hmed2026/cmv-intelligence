import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'CMV Intelligence — Gestão Financeira Inteligente',
    template: '%s | CMV Intelligence',
  },
  description:
    'Plataforma premium de gestão financeira com IA para análise de CMV, DRE e fluxo de caixa em tempo real.',
  keywords: [
    'CMV',
    'gestão financeira',
    'DRE',
    'fluxo de caixa',
    'inteligência artificial',
    'SaaS financeiro',
  ],
  authors: [{ name: 'CMV Intelligence' }],
  creator: 'CMV Intelligence',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'CMV Intelligence',
    description: 'Gestão Financeira Inteligente com IA',
    siteName: 'CMV Intelligence',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#080E1A" />
      </head>
      <body className="bg-[#080E1A] text-[#F9FAFB] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
