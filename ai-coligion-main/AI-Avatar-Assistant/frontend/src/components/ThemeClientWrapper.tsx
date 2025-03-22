'use client';

import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './ThemeProvider';

interface ThemeClientWrapperProps {
  children: React.ReactNode;
}

export default function ThemeClientWrapper({ children }: ThemeClientWrapperProps) {
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Prevent hydration issues with a skeleton
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
} 