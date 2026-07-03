import React from 'react';
import './globals.css';
import { Metadata } from 'next';
import { Providers } from './providers';

// Metadata for the app
export const metadata: Metadata = {
  title: 'ThriveAI — Elevate your potential',
  description:
    'Your personal AI-powered life coach for fitness, career, finances, and mental wellbeing.',
};

// Root layout component - Server Component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Brand fonts: Source Serif 4 (display), IBM Plex Sans (UI/body), IBM Plex Mono (data/labels) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
