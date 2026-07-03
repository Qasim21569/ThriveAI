'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, LogOut } from 'lucide-react';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'sonner';
import { useAuth } from '@/lib/firebase/authContext';
import { auth } from '@/lib/firebase/firebaseConfig';
import AuthModal from '@/components/auth/AuthModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Deliberately minimal. The previous version had toggles for dark mode,
 * animations, high contrast, notifications, and privacy preferences —
 * all persisted to Firestore, none of them read by any other part of the
 * app. Flipping "dark mode" and seeing nothing change is worse than not
 * offering the setting at all. Everything below actually does something.
 */
export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success('Password reset link sent', {
        description: `Check ${user.email} for instructions.`,
      });
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Could not send reset email. Please try again.');
    } finally {
      setSendingReset(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="mb-6 h-8 w-32" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4 py-12">
        <AuthModal open={!showAuthModal ? true : showAuthModal} onClose={() => router.push('/')} onSuccess={() => setShowAuthModal(true)} />
      </div>
    );
  }

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-serif text-2xl font-semibold text-foreground md:text-3xl">Settings</h1>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your ThriveAI account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-border bg-surface-sunken p-3">
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-text-body">{user.email}</p>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-sunken p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Password</p>
                <p className="text-sm text-text-muted">Send yourself a reset link by email.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handlePasswordReset} disabled={sendingReset}>
                <KeyRound className="size-3.5" />
                {sendingReset ? 'Sending…' : 'Reset password'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleSignOut} className="text-destructive hover:bg-destructive-soft">
              <LogOut className="size-4" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
