'use client';

import { useState } from 'react';
import type { User } from 'firebase/auth';
import { X } from 'lucide-react';
import SignIn from './SignIn';
import SignUp from './SignUp';

interface AuthModalProps {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: (user: User) => void;
  message?: string;
}

const AuthModal = ({ open = true, onClose, onSuccess, message }: AuthModalProps) => {
  const [isSignIn, setIsSignIn] = useState(true);

  const toggleAuthMode = () => setIsSignIn((v) => !v);

  const handleAuthSuccess = (user: User) => {
    if (onSuccess) onSuccess(user);
    if (onClose) onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {message && (
          <div className="mb-5 rounded-md border border-accent/25 bg-accent-soft px-4 py-3 text-center text-sm text-terracotta-600">
            {message}
          </div>
        )}

        {isSignIn ? (
          <SignIn onSuccess={handleAuthSuccess} onSignUpClick={toggleAuthMode} />
        ) : (
          <>
            <SignUp onSuccess={handleAuthSuccess} />
            <p className="mt-5 text-center text-sm text-text-muted">
              Already have an account?{' '}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
