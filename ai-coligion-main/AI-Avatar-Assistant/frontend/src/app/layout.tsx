import React from 'react';
import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import '../styles/globals.css';
import ThemeClientWrapper from '../components/ThemeClientWrapper';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Avatar Assistant',
  description: 'AI-driven assistant with human-like avatar for ERP support',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.variable} ${robotoMono.variable} font-sans`}>
        <ThemeClientWrapper>
          <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-dark-950 dark:to-dark-900">
            {children}
          </main>
        </ThemeClientWrapper>
      </body>
    </html>
  );
} 