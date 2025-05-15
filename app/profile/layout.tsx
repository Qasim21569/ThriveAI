import { ReactNode } from 'react';

// Simple layout that just renders the children
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <main>
      {children}
    </main>
  );
} 