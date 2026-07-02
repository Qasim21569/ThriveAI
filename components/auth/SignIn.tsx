'use client';

import { useState } from 'react';
import type { User } from 'firebase/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseConfig';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SignInProps {
  onSuccess?: (user: User) => void;
  onSignUpClick?: () => void;
}

const SignIn = ({ onSuccess, onSignUpClick }: SignInProps) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);

      if (onSuccess) {
        onSuccess(userCredential.user);
      }
    } catch (err: any) {
      let errorMessage = 'Failed to sign in';

      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      }

      setError(errorMessage);
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Welcome back</h2>
        <p className="mt-1 text-sm text-text-muted">Sign in to continue your coaching journey.</p>
      </div>

      {error && (
        <Alert tone="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signin-email">Email</Label>
          <Input
            id="signin-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signin-password">Password</Label>
          <Input
            id="signin-password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSignUpClick}
          className="font-medium text-primary hover:underline"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

export default SignIn;
