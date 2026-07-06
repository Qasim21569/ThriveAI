'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  CalendarDays,
  Plus,
  Star,
  Trash2,
  Save,
  Lock,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseConfig';
import { getUserPlans, setActivePlan, deletePlan, type PlanSummary } from '@/lib/firebase/plans';
import { getRecentCheckins } from '@/lib/firebase/checkins';
import { getRecentEvents, resetLifeModel } from '@/lib/firebase/lifeModel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { Stagger, StaggerItem } from '@/components/motion/stagger';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString?: string) {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
}

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Current password is incorrect.';
    case 'auth/weak-password':
      return 'New password must be at least 6 characters.';
    case 'auth/requires-recent-login':
      return 'For security, please sign out and sign back in before changing your password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const router = useRouter();

  // Auth state
  const [uid, setUid] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string>('password');
  const [userEmail, setUserEmail] = useState<string>('');

  // Identity section
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);

  // Security section
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Data counts
  const [checkinCount, setCheckinCount] = useState<number | null>(null);
  const [planCount, setPlanCount] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState<number | null>(null);

  // Plans section
  const [savedPlans, setSavedPlans] = useState<PlanSummary[]>([]);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  // Modals
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Loading
  const [isLoading, setIsLoading] = useState(true);

  const resetInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Bootstrap
  // -------------------------------------------------------------------------

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setUid(user.uid);
      setUserEmail(user.email ?? '');
      setDisplayName(user.displayName ?? user.email?.split('@')[0] ?? '');
      setPhotoURL(user.photoURL ?? '');
      setProviderId(user.providerData[0]?.providerId ?? 'password');

      // Load everything in parallel
      const [plans, checkins, events] = await Promise.all([
        getUserPlans(user.uid).catch(() => [] as PlanSummary[]),
        getRecentCheckins(user.uid, 365).catch(() => []),
        getRecentEvents(user.uid, 100).catch(() => []),
      ]);

      setSavedPlans(plans);
      setPlanCount(plans.length);
      setCheckinCount(checkins.length);
      setEventCount(events.length);
      setIsLoading(false);
      setIsPlansLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // -------------------------------------------------------------------------
  // Identity save
  // -------------------------------------------------------------------------

  const handleSaveIdentity = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsSavingIdentity(true);
    try {
      await updateProfile(user, {
        displayName: displayName.trim() || null,
        photoURL: photoURL.trim() || null,
      });
      toast.success('Profile updated');
    } catch {
      toast.error('Could not update profile. Please try again.');
    } finally {
      setIsSavingIdentity(false);
    }
  };

  // -------------------------------------------------------------------------
  // Password change
  // -------------------------------------------------------------------------

  const handleSavePassword = async () => {
    const user = auth.currentUser;
    if (!user || !userEmail) return;
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    setIsSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(userEmail, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password updated');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setPasswordError(mapFirebaseError(code));
    } finally {
      setIsSavingPassword(false);
    }
  };

  // -------------------------------------------------------------------------
  // Plans
  // -------------------------------------------------------------------------

  const handleSetActive = async (planId: string) => {
    if (!uid) return;
    setBusyPlanId(planId);
    try {
      await setActivePlan(uid, planId, savedPlans.map((p) => p.id));
      setSavedPlans((prev) => prev.map((p) => ({ ...p, isActive: p.id === planId })));
      toast.success('Active plan updated');
    } catch {
      toast.error('Could not update active plan');
    } finally {
      setBusyPlanId(null);
    }
  };

  const confirmAndDelete = async () => {
    if (!uid || !confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    setBusyPlanId(id);
    try {
      await deletePlan(uid, id);
      setSavedPlans((prev) => prev.filter((p) => p.id !== id));
      setPlanCount((c) => (c !== null ? c - 1 : c));
      toast.success('Plan deleted');
    } catch {
      toast.error('Could not delete plan');
    } finally {
      setBusyPlanId(null);
    }
  };

  // -------------------------------------------------------------------------
  // Reset life model
  // -------------------------------------------------------------------------

  const handleReset = async () => {
    if (!uid || resetInput !== 'reset') return;
    setIsResetting(true);
    try {
      await resetLifeModel(uid);
      setShowResetModal(false);
      setResetInput('');
      setEventCount(0);
      toast.success(
        'Life model cleared. Your check-ins are kept so the brain can re-learn as you chat.',
      );
    } catch {
      toast.error('Reset failed. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Loading skeleton
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="px-4 py-12">
        <div className="mx-auto max-w-app space-y-8">
          <Skeleton className="h-12 w-56" />
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Page
  // -------------------------------------------------------------------------

  const memberSince = auth.currentUser?.metadata.creationTime;

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-app">
        <Stagger className="space-y-8">
          {/* Page header */}
          <StaggerItem>
            <PageHeader
              eyebrow="Account"
              title="Profile"
              sub="Your account and data"
            />
          </StaggerItem>

          {/* 1. Identity card */}
          <StaggerItem>
            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <User className="size-5 text-text-muted" />
                <h2 className="font-serif text-lg font-semibold text-foreground">Identity</h2>
              </div>
              <div className="mb-6 flex items-center gap-4">
                <Avatar
                  src={photoURL || null}
                  fallback={displayName?.charAt(0)?.toUpperCase() || 'U'}
                  size="lg"
                  className="size-16 shrink-0 text-xl"
                />
                <div>
                  <p className="font-medium text-foreground">{displayName || 'No name set'}</p>
                  <p className="text-sm text-text-muted">{userEmail}</p>
                  {memberSince && (
                    <p className="mt-0.5 font-mono text-xs uppercase tracking-wide text-text-muted">
                      Member since {formatDate(memberSince)}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="display-name">
                    Display name
                  </label>
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="photo-url">
                    Photo URL
                  </label>
                  <Input
                    id="photo-url"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleSaveIdentity}
                  disabled={isSavingIdentity}
                  size="sm"
                >
                  <Save className="size-3.5" />
                  {isSavingIdentity ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </Card>
          </StaggerItem>

          {/* 2. Security card */}
          <StaggerItem>
            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <Lock className="size-5 text-text-muted" />
                <h2 className="font-serif text-lg font-semibold text-foreground">Security</h2>
              </div>

              {providerId !== 'password' ? (
                <div className="rounded-md border border-border bg-surface-sunken p-4">
                  <p className="text-sm text-text-body">
                    Signed in with{' '}
                    <span className="font-medium text-foreground capitalize">
                      {providerId === 'google.com' ? 'Google' : providerId}
                    </span>
                    . Password management is handled by your identity provider.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="current-password">
                      Current password
                    </label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPasswordError(null);
                      }}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="new-password">
                      New password
                    </label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError(null);
                      }}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSavePassword}
                      disabled={isSavingPassword || !currentPassword || !newPassword}
                      size="sm"
                    >
                      <Lock className="size-3.5" />
                      {isSavingPassword ? 'Updating...' : 'Update password'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </StaggerItem>

          {/* 3. Data card */}
          <StaggerItem>
            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <Database className="size-5 text-text-muted" />
                <h2 className="font-serif text-lg font-semibold text-foreground">Your data</h2>
              </div>

              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="rounded-md border border-border bg-surface-sunken p-4 text-center">
                  <p className="font-serif text-2xl font-semibold text-foreground">
                    {checkinCount === null
                      ? '--'
                      : checkinCount >= 365
                      ? '365+'
                      : checkinCount}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">Check-ins</p>
                </div>
                <div className="rounded-md border border-border bg-surface-sunken p-4 text-center">
                  <p className="font-serif text-2xl font-semibold text-foreground">
                    {planCount === null ? '--' : planCount}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">Plans</p>
                </div>
                <div className="rounded-md border border-border bg-surface-sunken p-4 text-center">
                  <p className="font-serif text-2xl font-semibold text-foreground">
                    {eventCount === null
                      ? '--'
                      : eventCount >= 100
                      ? '100+'
                      : eventCount}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">Events</p>
                </div>
              </div>

              <div className="rounded-md border border-destructive/20 bg-destructive-soft p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Reset life model</p>
                    <p className="mt-0.5 text-sm text-text-muted">
                      Clears what the AI has learned about you -- goals, area summaries, and events.
                      Your check-ins and plans are kept so the brain can re-learn from them.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setShowResetModal(true);
                      setResetInput('');
                    }}
                  >
                    Reset life model
                  </Button>
                </div>
              </div>
            </Card>
          </StaggerItem>

          {/* 4. Plans card */}
          <StaggerItem>
            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <CalendarDays className="size-5 text-text-muted" />
                <h2 className="font-serif text-lg font-semibold text-foreground">My saved plans</h2>
              </div>

              {isPlansLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              ) : savedPlans.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {savedPlans.map((plan) => (
                    <Card key={plan.id} className="flex h-full flex-col p-5">
                      <Link
                        href={
                          plan.type === 'mental'
                            ? `/mental/report/${plan.id}`
                            : `/fitness/plan/${plan.id}`
                        }
                        className="flex-1"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <Badge tone={plan.type === 'fitness' ? 'primary' : 'accent'}>
                            {plan.type}
                          </Badge>
                          {plan.isActive && (
                            <Badge tone="success" dot>
                              Active
                            </Badge>
                          )}
                        </div>
                        <h4 className="mb-3 font-serif text-lg font-semibold text-foreground hover:text-primary">
                          {plan.title}
                        </h4>
                        <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
                          Created {formatDate(plan.createdAt)}
                        </p>
                      </Link>
                      <div className="mt-4 flex gap-2 border-t border-border pt-3">
                        {!plan.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busyPlanId === plan.id}
                            onClick={() => handleSetActive(plan.id)}
                          >
                            <Star className="size-3.5" /> Set active
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyPlanId === plan.id}
                          onClick={() => setConfirmDelete({ id: plan.id, title: plan.title })}
                          className="text-destructive hover:bg-destructive-soft hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border-strong bg-surface-sunken px-6 py-12 text-center">
                  <p className="mb-1 text-sm font-medium text-foreground">No saved plans yet</p>
                  <p className="mb-4 text-sm text-text-muted">
                    Create a fitness or mental wellness plan and it will appear here.
                  </p>
                  <Button onClick={() => router.push('/dashboard')} variant="outline">
                    <Plus className="size-4" /> Create a plan
                  </Button>
                </div>
              )}
            </Card>
          </StaggerItem>
        </Stagger>
      </div>

      {/* Delete plan confirmation modal */}
      {confirmDelete && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmDelete(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            <h2 className="font-serif text-lg font-semibold text-foreground">Delete this plan?</h2>
            <p className="mt-2 text-sm text-text-muted">
              &ldquo;{confirmDelete.title}&rdquo; will be permanently deleted. This cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmAndDelete}>
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Reset life model modal */}
      {showResetModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          onClick={() => {
            if (!isResetting) {
              setShowResetModal(false);
              setResetInput('');
            }
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="size-5 shrink-0 text-destructive" />
              <h2
                id="reset-modal-title"
                className="font-serif text-lg font-semibold text-foreground"
              >
                Reset life model?
              </h2>
            </div>
            <p className="text-sm text-text-muted">
              This permanently clears the AI memory of your goals, area summaries, and events.
              Your check-ins and plans are untouched -- the brain re-learns from them the next
              time you chat.
            </p>
            <p className="mt-4 text-sm text-text-muted">
              Type <span className="font-mono font-semibold text-foreground">reset</span> to
              confirm.
            </p>
            <Input
              ref={resetInputRef}
              className="mt-2"
              value={resetInput}
              onChange={(e) => setResetInput(e.target.value)}
              placeholder="reset"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && resetInput === 'reset') handleReset();
              }}
            />
            <div className="mt-6 flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isResetting}
                onClick={() => {
                  setShowResetModal(false);
                  setResetInput('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={resetInput !== 'reset' || isResetting}
                onClick={handleReset}
              >
                {isResetting ? 'Resetting...' : 'Reset life model'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
