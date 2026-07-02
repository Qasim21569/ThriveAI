'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, CalendarDays, Plus } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import { getUserSavedPlans } from '@/lib/firebase/userService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Interface for user's saved plans
interface SavedPlan {
  id?: string;
  type: string;
  title: string;
  description: string;
  date?: string;
  path: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ProfilePage() {
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
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

  // Try to get Firebase user data without blocking page load
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserData({
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || 'No email available',
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          creationTime: user.metadata.creationTime || new Date().toISOString(),
        });

        // Load user's plans from Firebase
        loadUserPlans(user.uid);
      } else {
        setIsLoading(false);
        setIsPlansLoading(false);
        setSavedPlans([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load user plans from Firebase
  const loadUserPlans = async (userId: string) => {
    setIsPlansLoading(true);
    setError(null);

    try {
      const firebasePlans = await getUserSavedPlans(userId);

      if (firebasePlans && firebasePlans.length > 0) {
        setSavedPlans(firebasePlans);
      } else {
        setSavedPlans([]);
      }
    } catch (err) {
      console.error('Error loading user plans:', err);
      setError('Failed to load your saved plans. Please try again later.');
      setSavedPlans([]);
    } finally {
      setIsLoading(false);
      setIsPlansLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'January 1, 2023';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'January 1, 2023';
    }
  };

  const Spinner = ({ className = '' }: { className?: string }) => (
    <div className={`animate-spin rounded-full border-4 border-primary/25 border-t-primary ${className}`} />
  );

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-app">
        {/* Back to Home */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <h1 className="mb-8 text-center font-serif text-3xl font-semibold tracking-[-0.015em] text-foreground md:text-4xl">
          Your profile
        </h1>

        {error && (
          <Alert tone="destructive" className="mx-auto mb-6 max-w-2xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          {/* Sidebar */}
          <Card className="h-fit p-6 text-center">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Spinner className="size-8" />
              </div>
            ) : (
              <>
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
              </>
            )}
          </Card>

          {/* Content Area */}
          <Card className="min-h-[400px] p-6">
            {isLoading ? (
              <div className="flex h-[360px] items-center justify-center">
                <Spinner className="size-10" />
              </div>
            ) : (
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

                {/* Profile Info */}
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

                {/* My Plans */}
                <TabsContent value="plans">
                  <h3 className="mb-4 font-serif text-xl font-semibold text-foreground">
                    My saved plans
                  </h3>

                  {isPlansLoading ? (
                    <div className="flex justify-center py-16">
                      <Spinner className="size-10" />
                    </div>
                  ) : savedPlans.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {savedPlans.map((plan, index) => (
                        <Link key={plan.id || index} href={plan.path} className="group">
                          <Card className="h-full p-5 transition-[box-shadow,border-color] duration-base ease-standard group-hover:border-border-strong group-hover:shadow-md">
                            <h4 className="mb-1 font-serif text-lg font-semibold text-foreground">
                              {plan.title}
                            </h4>
                            <p className="mb-3 text-sm text-text-body">{plan.description}</p>
                            <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
                              Created {plan.date || formatDate(plan.createdAt)}
                            </p>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border-strong bg-surface-sunken px-6 py-12 text-center">
                      <p className="mb-4 text-text-muted">You don&apos;t have any saved plans yet.</p>
                      <Button onClick={() => router.push('/#modes')} variant="outline">
                        <Plus className="size-4" /> Explore coaching areas
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
