import React from 'react';
import Head from 'next/head';

// This component adds favicon links to the HEAD
export default function Favicon() {
  return (
    <Head>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#4f46e5" />
    </Head>
  );
} 