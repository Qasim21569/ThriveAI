'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from '@/lib/firebase/authContext';
import { Toaster } from 'sonner';

// Theme definition
const theme = createTheme({
  palette: {
    primary: {
      main: '#4C52FF',
      light: '#6065FF',
      dark: '#3A3FFF',
    },
    secondary: {
      main: '#1A1A2E',
      light: '#2A2A3E',
      dark: '#0A0A1E',
    },
    background: {
      default: '#0A0A0F',
      paper: '#1A1A2E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          padding: '0.75rem 1.5rem',
        },
      },
    },
  },
});

// Client-side wrapper to avoid hydration mismatch
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
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