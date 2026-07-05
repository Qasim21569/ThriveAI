'use client';

import React from 'react';
import { AuthProvider } from '@/lib/firebase/authContext';
import { Toaster as SonnerToaster } from 'sonner';

/**
 * Global client providers: Firebase auth context + sonner toasts.
 * Mounted once in the root layout so every route has auth context.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <SonnerToaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgb(var(--surface, 251 249 245))',
            color: 'rgb(var(--foreground, 42 38 32))',
            border: '1px solid rgb(var(--border, 229 221 208))',
            borderRadius: 'var(--radius-md, 10px)',
            fontFamily: 'var(--font-sans)',
            boxShadow: 'var(--shadow-xl)',
          },
          duration: 4000,
        }}
      />
    </AuthProvider>
  );
}
