'use client';

import type { ReactNode } from 'react';
import { WalkthroughProvider } from '@/components/walkthrough/walkthrough-provider';

/**
 * AppShell — client wrapper that mounts the WalkthroughProvider inside the
 * server-component (app) layout. Keeps the layout.tsx as a pure server
 * component (no 'use client' boundary on the layout file itself).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return <WalkthroughProvider>{children}</WalkthroughProvider>;
}
