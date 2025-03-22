'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous attribute values
    if (attribute === 'class') {
      root.classList.remove('light', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    
    // Handle system preference
    if (theme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      
      if (attribute === 'class') {
        root.classList.add(systemTheme);
      } else {
        root.setAttribute('data-theme', systemTheme);
      }
      return;
    }
    
    // Set attribute based on theme
    if (attribute === 'class') {
      root.classList.add(theme);
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme, attribute, enableSystem]);
  
  // Listen for system preference changes
  useEffect(() => {
    if (!enableSystem) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        const root = window.document.documentElement;
        
        if (attribute === 'class') {
          root.classList.remove('light', 'dark');
          root.classList.add(systemTheme);
        } else {
          root.setAttribute('data-theme', systemTheme);
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, attribute, enableSystem]);
  
  const value = {
    theme,
    setTheme,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeProvider; 