import React from 'react';
import './globals.css';
import { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';

// Metadata for the app
export const metadata: Metadata = {
  title: 'Thrive AI',
  description: 'Your personal AI-powered life coach for fitness, career, finances, and mental wellbeing.',
};

// Root layout component - Server Component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

// Client side components are in client-layout.tsx file
