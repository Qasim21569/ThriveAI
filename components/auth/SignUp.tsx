'use client';

import { useState } from 'react';
import type { User } from 'firebase/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseConfig';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SignUpProps {
  onSuccess?: (user: User) => void;
}

const SignUp = ({ onSuccess }: SignUpProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      if (onSuccess) {
        onSuccess(userCredential.user);
      }
    } catch (err: any) {
      let errorMessage = 'Failed to create account';

      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }

      setError(errorMessage);
      console.error('Sign-up error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Create your account</h2>
        <p className="mt-1 text-sm text-text-muted">Join ThriveAI for personalized guidance.</p>
      </div>

      {error && (
        <Alert tone="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
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
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            name="password"
            type="password"
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-confirm">Confirm password</Label>
          <Input
            id="signup-confirm"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
              Creating account…
            </>
          ) : (
            'Sign up'
          )}
        </Button>
      </form>
    </div>
  );
};

export default SignUp;
