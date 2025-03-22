'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Check system preference as fallback when context isn't available
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setCurrentTheme(isDarkMode ? 'dark' : 'light');
  }, []);

  // Safe use of theme context
  let themeContextValue;
  try {
    themeContextValue = useTheme();
  } catch (e) {
    // Context not available yet, use fallback values
    themeContextValue = {
      theme: 'system',
      setTheme: (theme: 'dark' | 'light' | 'system') => {
        setCurrentTheme(theme === 'system' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme);
        // Apply the theme manually until context is available
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(systemTheme);
        } else {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(theme);
        }
      }
    };
  }

  const { theme, setTheme } = themeContextValue;

  if (!mounted) return null;

  const isLight = theme === 'light' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches) ||
    (theme === undefined && currentTheme === 'light');

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      className="icon-button relative p-2 rounded-full"
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <span className="sr-only">{isLight ? 'Switch to dark mode' : 'Switch to light mode'}</span>
      {isLight ? (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-primary-800"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
          />
        </svg>
      ) : (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-yellow-300"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
          />
        </svg>
      )}
    </motion.button>
  );
} 