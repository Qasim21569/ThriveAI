'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from '@/lib/firebase/authContext';
import { Toaster } from 'sonner';

// Theme definition
const theme = createTheme({
  palette: {
    primary: {
      main: '#8258FF',
    },
    secondary: {
      main: '#FF58A6',
    },
    background: {
      default: '#12131A',
      paper: '#1A1A2E',
    },
    text: {
      primary: '#F8F9FF',
      secondary: '#A9A9D8',
    },
  },
  typography: {
    fontFamily: 'var(--font-sans), sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

// Client-side wrapper to avoid hydration mismatch
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Disable smooth scrolling for better performance
    const disableSmoothScroll = () => {
      const style = document.createElement('style');
      style.textContent = `
        html {
          scroll-behavior: auto !important;
        }
        * {
          -webkit-overflow-scrolling: auto !important;
        }
      `;
      document.head.appendChild(style);
    };
    
    // Add custom scrolling improvement
    const optimizeScrolling = () => {
      // Add will-change hints to optimize GPU acceleration
      const addScrollOptimization = () => {
        document.querySelectorAll('.fixed, .sticky, .absolute').forEach((el) => {
          if (el instanceof HTMLElement) {
            el.style.willChange = 'transform';
            el.style.transform = 'translateZ(0)';
          }
        });
      };

      // Add passive event listeners
      window.addEventListener('scroll', () => {}, { passive: true });
      window.addEventListener('touchstart', () => {}, { passive: true });
      
      // Apply optimizations after DOM is ready
      if (document.readyState === 'complete') {
        addScrollOptimization();
      } else {
        window.addEventListener('load', addScrollOptimization);
      }
    };

    // Reduce animation frame rate for better performance
    const limitAnimationFrames = () => {
      const style = document.createElement('style');
      style.textContent = `
        @media (prefers-reduced-motion: no-preference) {
          .animate-slow {
            animation-duration: calc(1s * 1.5) !important;
          }
          .motion-reduce * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `;
      document.head.appendChild(style);
    };

    disableSmoothScroll();
    optimizeScrolling();
    limitAnimationFrames();
    
    // Apply throttling to scroll events
    let lastKnownScrollPosition = 0;
    let ticking = false;
    
    function doSomething(scrollPos) {
      // Here you could do something with the scroll position
      // but we're just using this to throttle the event
    }
    
    document.addEventListener('scroll', () => {
      lastKnownScrollPosition = window.scrollY;
      
      if (!ticking) {
        window.requestAnimationFrame(() => {
          doSomething(lastKnownScrollPosition);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    
    setIsClient(true);
  }, []);

  // Return a hidden container until client-side rendering is ready
  if (!isClient) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1A1A2E',
              color: '#FFFFFF',
              border: '1px solid rgba(76, 82, 255, 0.2)',
            },
            duration: 4000,
          }}
        />
      </ThemeProvider>
    </AuthProvider>
  );
} 