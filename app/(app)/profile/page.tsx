'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, CalendarDays, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase/firebaseConfig';
import { getUserPlans, setActivePlan, deletePlan, type PlanSummary } from '@/lib/firebase/plans';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const [savedPlans, setSavedPlans] = useState<PlanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [userData, setUserData] = useState<{
    displayName: string;
    email: string;
    photoURL: string | null;
    emailVerified: boolean;
    creationTime: string;
  }>({
    displayName: 'User',
    email: 'user@example.com',
    photoURL: null,
    emailVerified: true,
    creationTime: new Date().toISOString(),
  });
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid);
        setUserData({
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || 'No email available',
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          creationTime: user.metadata.creationTime || new Date().toISOString(),
        });
        loadUserPlans(user.uid);
      } else {
        setIsLoading(false);
        setIsPlansLoading(false);
        setSavedPlans([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserPlans = async (userId: string) => {
    setIsPlansLoading(true);
    setError(null);

    try {
      const firebasePlans = await getUserPlans(userId);
      setSavedPlans(firebasePlans ?? []);
    } catch (err) {
      console.error('Error loading user plans:', err);
      setError('Failed to load your saved plans. Please try again later.');
      setSavedPlans([]);
    } finally {
      setIsLoading(false);
      setIsPlansLoading(false);
    }
  };

  const handleSetActive = async (planId: string) => {
    if (!uid) return;
    setBusyPlanId(planId);
    try {
      await setActivePlan(uid, planId, savedPlans.map((p) => p.id));
      setSavedPlans((prev) => prev.map((p) => ({ ...p, isActive: p.id === planId })));
      toast.success('Active plan updated');
    } catch (err) {
      console.error('Error setting active plan:', err);
      toast.error('Could not update active plan');
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleDelete = async (planId: string, title: string) => {
    if (!uid) return;
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    setBusyPlanId(planId);
    try {
      await deletePlan(uid, planId);
      setSavedPlans((prev) => prev.filter((p) => p.id !== planId));
      toast.success('Plan deleted');
    } catch (err) {
      console.error('Error deleting plan:', err);
      toast.error('Could not delete plan');
    } finally {
      setBusyPlanId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'January 1, 2023';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'January 1, 2023';
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-12">
        <div className="mx-auto max-w-app">
          <Skeleton className="mx-auto mb-8 h-9 w-48" />
          <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
            <Card className="h-fit p-6 text-center">
              <Skeleton className="mx-auto mb-3 size-20 rounded-full" />
              <Skeleton className="mx-auto mb-2 h-5 w-32" />
              <Skeleton className="mx-auto h-4 w-40" />
            </Card>
            <Card className="min-h-[400px] p-6">
              <Skeleton className="mb-6 h-9 w-64" />
              <Skeleton className="mb-3 h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-app">
        <h1 className="mb-8 text-center font-serif text-3xl font-semibold tracking-[-0.015em] text-foreground md:text-4xl">
          Your profile
        </h1>

        {error && (
          <Alert tone="destructive" className="mx-auto mb-6 max-w-2xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <Card className="h-fit p-6 text-center">
            <Avatar
              src={userData.photoURL}
              fallback={userData.displayName?.charAt(0) || 'U'}
              size="lg"
              className="mx-auto mb-3 size-20 text-2xl"
            />
            <h2 className="text-lg font-semibold text-foreground">{userData.displayName}</h2>
            <p className="mt-0.5 text-sm text-text-muted">{userData.email}</p>
            <p className="mt-3 font-mono text-xs uppercase tracking-wide text-text-muted">
              Member since {formatDate(userData.creationTime)}
            </p>
          </Card>

          <Card className="min-h-[400px] p-6">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
                <TabsTrigger
                  value="profile"
                  className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <User className="size-4" /> Profile
                </TabsTrigger>
                <TabsTrigger
                  value="plans"
                  className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <CalendarDays className="size-4" /> Plans
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <h3 className="mb-4 font-serif text-xl font-semibold text-foreground">
                  Profile information
                </h3>
                <div className="space-y-3">
                  <div className="rounded-md border border-border bg-surface-sunken p-3">
                    <p className="text-sm font-medium text-foreground">Name</p>
                    <p className="text-sm text-text-body">{userData.displayName}</p>
                  </div>
                  <div className="rounded-md border border-border bg-surface-sunken p-3">
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm text-text-body">{userData.email}</p>
                  </div>
                  <div className="rounded-md border border-border bg-surface-sunken p-3">
                    <p className="mb-1 text-sm font-medium text-foreground">Account status</p>
                    <Badge tone={userData.emailVerified ? 'success' : 'destructive'} dot>
                      {userData.emailVerified ? 'Verified' : 'Not verified'}
                    </Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="plans">
                <h3 className="mb-4 font-serif text-xl font-semibold text-foreground">
                  My saved plans
                </h3>

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
                          href={plan.type === 'mental' ? `/mental/report/${plan.id}` : `/fitness/plan/${plan.id}`}
                          className="flex-1"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Badge tone={plan.type === 'fitness' ? 'primary' : 'accent'}>
                              {plan.type}
                            </Badge>
                            {plan.isActive && (
                              <Badge tone="success" dot>Active</Badge>
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
                            onClick={() => handleDelete(plan.id, plan.title)}
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
                    <p className="mb-4 text-text-muted">You don&apos;t have any saved plans yet.</p>
                    <Button onClick={() => router.push('/dashboard')} variant="outline">
                      <Plus className="size-4" /> Create a plan
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
