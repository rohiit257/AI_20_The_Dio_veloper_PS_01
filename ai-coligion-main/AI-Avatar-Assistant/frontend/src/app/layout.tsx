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
        {/* Adding preconnect for D-ID domains to improve loading */}
        <link rel="preconnect" href="https://agent.d-id.com" />
        <link rel="preconnect" href="https://d-id.com" crossOrigin="anonymous" />
        
        {/* D-ID Agent Script with sync loading to ensure it's ready when needed */}
        <script
          type="module"
          src="https://agent.d-id.com/v1/index.js"
          data-name="did-agent"
          data-mode="fabio"
          data-client-key="Z29vZ2xlLW9hdXRoMnwxMDQ0MjQzNzIyMTExMDExMjkwMDA6SHhPcG9ibG10a0tVODRLYTVhNTBZ"
          data-agent-id="agt_0hWQiLqG"
          data-monitor="true"
          crossOrigin="anonymous"
          async={false}
        ></script>
        
        {/* Script to force D-ID elements to be properly created on Vercel */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Pre-create a global container for D-ID
          window.DID_READY = false;
          
          // Ensure DOM is ready
          document.addEventListener('DOMContentLoaded', function() {
            console.log('Vercel DOM loaded, initializing D-ID agent...');
            
            // Force create the did-agent element if not already present
            setTimeout(() => {
              if (!document.querySelector('did-agent')) {
                console.log('Creating did-agent element manually');
                const didAgent = document.createElement('did-agent');
                const didContainer = document.getElementById('did-container');
                if (didContainer) {
                  didContainer.appendChild(didAgent);
                  console.log('did-agent element added to container');
                } else {
                  console.error('did-container not found');
                }
              }
            }, 1000);
            
            // Hide loading overlay after a timeout if still visible
            setTimeout(() => {
              const loadingOverlay = document.getElementById('agent-loading-overlay');
              if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
                console.log('Force hiding loading overlay');
              }
            }, 8000);
          });
          
          // Error tracking
          window.didAgentLoaded = false;
          window.didAgentError = null;
          
          window.addEventListener('error', (event) => {
            if (event.filename && event.filename.includes('d-id.com')) {
              console.error('D-ID script error:', event.message);
              window.didAgentError = event.message;
              const errorEl = document.getElementById('did-error');
              if (errorEl) errorEl.textContent = event.message;
            }
          });
        `}} />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeClientWrapper>
          {children}
        </ThemeClientWrapper>
      </body>
    </html>
  );
}