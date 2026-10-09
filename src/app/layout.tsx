import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.atalhogratis.com.br'),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', locale: 'pt_BR', url: '/', siteName: 'Atalhos Grátis',
    title: 'Atalhos Grátis — seus acessos em um só lugar',
    description: 'Sistemas, consultas e serviços de Mato Grosso. Encontre o atalho que você precisa.',
    images: [{ url: '/compartilhar.png', width: 1200, height: 630, alt: 'Atalhos Grátis — Sistemas, consultas e serviços de Mato Grosso' }],
  },
  twitter: { card: 'summary_large_image', title: 'Atalhos Grátis', description: 'Sistemas, consultas e serviços de Mato Grosso em um só lugar.', images: ['/compartilhar.png'] },
  title: "Atalhos Grátis",
  description: "Sistemas, consultas e serviços de Mato Grosso organizados em um só lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
