import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ThemeClientWrapper from '../components/ThemeClientWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Avatar Assistant',
  description: 'Interactive AI Avatar Assistant with D-ID integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://agent.d-id.com/v1/index.js" type="module" async></script>
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeClientWrapper>
          {children}
        </ThemeClientWrapper>
      </body>
    </html>
  );
}