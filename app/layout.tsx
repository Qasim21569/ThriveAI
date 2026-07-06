import React from 'react';
import './globals.css';
import { Metadata } from 'next';
import { Providers } from './providers';

// Metadata for the app
export const metadata: Metadata = {
  title: 'ThriveAI: Elevate your potential',
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
        {/* No-FOUC theme boot: reads localStorage before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Brand fonts: Instrument Serif (display/serif), Inter (UI/body), IBM Plex Mono (data/labels/eyebrows) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
