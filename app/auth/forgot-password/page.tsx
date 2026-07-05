'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseConfig';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FadeIn } from '@/components/motion/fade-in';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      // Don't reveal whether an account exists — same message either way.
      if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="mb-6 flex justify-center">
          <Link
            href="/auth/sign-in"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm text-text-muted transition-colors duration-fast ease-standard hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </div>

        <FadeIn>
          <Card className="p-8 shadow-xl">
            <div className="mb-6 text-center">
              <h1 className="font-serif text-[30px] font-semibold leading-tight tracking-[-0.015em] text-foreground md:text-[36px]">
                Reset password
              </h1>
              <p className="mt-1.5 text-sm text-text-muted">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            {error && (
              <Alert tone="destructive" className="mb-5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {sent ? (
              <Alert tone="success">
                <AlertDescription>
                  If an account exists for {email}, a password reset link is on its way. Check your inbox.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                      Sending…
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            )}
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
