'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronDown, ChevronUp, Check, CalendarDays,
  Dumbbell, Target, TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase/firebaseConfig';
import { getPlan } from '@/lib/firebase/plans';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ---------- types ----------

interface Exercise { name: string; sets: number; reps: number; notes?: string }
interface Workout { name: string; description: string; duration: string; exercises: Exercise[] }
interface Meal { name: string; description: string; time: string }
interface DayRoutine { workouts: string[]; nutrition: string; recovery: string }
interface FitnessPlan {
  health_summary?: { overview: string; recommendations: string[]; cautions: string[] };
  diet: { meals: Meal[]; recommendations: string[]; restrictions: string[] };
  workouts: Workout[];
  goals: { short_term: string[]; long_term: string[]; metrics: Record<string, string> };
  weekly_routine: Record<string, DayRoutine>;
  recommendations?: string[];
}

// ---------- helpers ----------

function ensureValidWeeklyRoutine(plan: FitnessPlan): FitnessPlan {
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const fallback = { workouts: ['Rest day'], nutrition: 'Balanced meals with adequate hydration', recovery: 'Light stretching and proper rest' };
  if (!plan.weekly_routine) plan.weekly_routine = {};
  days.forEach(day => {
    if (!plan.weekly_routine[day]) {
      plan.weekly_routine[day] = { ...fallback };
    } else if (!Array.isArray(plan.weekly_routine[day].workouts)) {
      plan.weekly_routine[day].workouts = ['Rest day'];
    } else if (plan.weekly_routine[day].workouts.length === 0) {
      plan.weekly_routine[day].workouts = ['Rest day'];
    }
  });
  return plan;
}

// ---------- page ----------

const tabClass = 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs';

export default function PlanPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<number | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load the plan from Firestore once auth is ready
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setError('Please sign in to view this plan.');
        setLoading(false);
        return;
      }
      try {
        const record = await getPlan(user.uid, planId);
        if (!record) {
          setError('Plan not found. It may have been deleted or belongs to another account.');
          setLoading(false);
          return;
        }
        setPlan(ensureValidWeeklyRoutine(record.data as unknown as FitnessPlan));
      } catch (err) {
        console.error('Error loading plan:', err);
        setError('Failed to load your plan. Please try again.');
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, [planId]);

  const toggleWorkout = (i: number) => setActiveWorkout(prev => prev === i ? null : i);

  const downloadAsPDF = async () => {
    if (!contentRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const Html2Canvas = await import('html2canvas').then(m => m.default);
      const JsPDF = await import('jspdf').then(m => m.default);
      window.scrollTo(0, 0);
      const canvas = await Html2Canvas(contentRef.current, { scale: 1.5, useCORS: true, logging: false, windowWidth: 1200 });
      const pdf = new JsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('FitnessPlan.pdf');
    } catch {
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderWorkouts = useCallback(() => {
    if (!plan?.workouts?.length) return <p className="text-center text-text-muted">No workout data available.</p>;
    return plan.workouts.map((workout, i) => (
      <div key={i} className="mb-4 rounded-md border border-border bg-surface-sunken p-4">
        <div className="flex cursor-pointer items-center justify-between" onClick={() => toggleWorkout(i)}>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{workout.name || 'Untitled Workout'}</h3>
            <p className="text-sm text-text-body">{workout.description}</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-wide text-text-muted">Duration: {workout.duration}</p>
          </div>
          {activeWorkout === i ? <ChevronUp className="size-5 text-text-muted" /> : <ChevronDown className="size-5 text-text-muted" />}
        </div>
        {activeWorkout === i && (
          <div className="mt-4 border-t border-border pt-4">
            <h4 className="mb-2 text-sm font-medium text-foreground">Exercises</h4>
            <div className="space-y-3">
              {workout.exercises?.map((ex, ei) => (
                <div key={ei} className="rounded-md border border-border bg-surface p-3">
                  <h5 className="font-medium text-foreground">{ex.name}</h5>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-sm text-text-body">
                    <div>Sets: {ex.sets}</div>
                    <div>Reps: {ex.reps}</div>
                  </div>
                  {ex.notes && <p className="mt-2 text-sm text-text-muted"><span className="font-medium">Notes:</span> {ex.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.workouts, activeWorkout]);

  // ---------- states ----------

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
        <p className="text-text-muted">Loading your fitness plan…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <p className="mb-6 text-text-body">{error}</p>
        <Button onClick={() => router.push('/fitness/form')} variant="primary">Start a new plan</Button>
      </div>
    </div>
  );

  if (!plan) return null;

  // ---------- render ----------

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-app" ref={contentRef}>
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-accent">Your plan</span>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.015em] text-foreground md:text-4xl">
            Your personalized fitness plan
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-text-muted">
            Based on your profile, we&apos;ve built a plan to help you reach your fitness goals.
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8 grid grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="overview" className={tabClass}>Overview</TabsTrigger>
            <TabsTrigger value="workouts" className={tabClass}>Workouts</TabsTrigger>
            <TabsTrigger value="nutrition" className={tabClass}>Nutrition</TabsTrigger>
            <TabsTrigger value="schedule" className={tabClass}>Schedule</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {plan.health_summary && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Target className="size-5 text-primary" />
                      <CardTitle>Your health profile</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-text-body">{plan.health_summary.overview}</p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {plan.health_summary.recommendations?.length > 0 && (
                        <div>
                          <h3 className="mb-2 font-medium text-foreground">Recommendations</h3>
                          <ul className="space-y-2">
                            {plan.health_summary.recommendations.map((r, i) => (
                              <li key={i} className="flex items-start text-sm text-text-body">
                                <Check className="mr-2 mt-0.5 size-4 flex-shrink-0 text-success" />{r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {plan.health_summary.cautions?.length > 0 && (
                        <div>
                          <h3 className="mb-2 font-medium text-foreground">Cautions</h3>
                          <ul className="space-y-2">
                            {plan.health_summary.cautions.map((c, i) => (
                              <li key={i} className="flex items-start text-sm text-text-body">
                                <TriangleAlert className="mr-2 mt-0.5 size-4 flex-shrink-0 text-warning" />{c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Dumbbell className="size-5 text-primary" />
                    <CardTitle>Your goals</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="mb-2 font-medium text-foreground">Short-term</h3>
                    <ul className="space-y-2">
                      {plan.goals?.short_term?.map((g, i) => (
                        <li key={i} className="flex items-start text-sm text-text-body">
                          <Check className="mr-2 mt-0.5 size-4 flex-shrink-0 text-success" />{g}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 font-medium text-foreground">Long-term</h3>
                    <ul className="space-y-2">
                      {plan.goals?.long_term?.map((g, i) => (
                        <li key={i} className="flex items-start text-sm text-text-body">
                          <Check className="mr-2 mt-0.5 size-4 flex-shrink-0 text-success" />{g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="size-5 text-primary" />
                    <CardTitle>Tracking metrics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(plan.goals?.metrics || {}).map(([k, v], i) => (
                      <div key={i} className="rounded-md border border-border bg-surface-sunken p-3">
                        <h3 className="mb-1 font-medium capitalize text-foreground">{k.replace(/_/g, ' ')}</h3>
                        <p className="text-sm text-text-body">{v}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workouts */}
          <TabsContent value="workouts">
            <Card>
              <CardHeader>
                <CardTitle>Your workout plan</CardTitle>
                <CardDescription>A series of workouts designed to help you reach your fitness goals.</CardDescription>
              </CardHeader>
              <CardContent>{renderWorkouts()}</CardContent>
            </Card>
          </TabsContent>

          {/* Nutrition */}
          <TabsContent value="nutrition">
            <Card>
              <CardHeader>
                <CardTitle>Nutrition plan</CardTitle>
                <CardDescription>Recommended meals and dietary guidelines.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-3 text-base font-semibold text-foreground">Recommended meals</h3>
                  <div className="space-y-3">
                    {plan.diet?.meals?.map((meal, i) => (
                      <div key={i} className="rounded-md border border-border bg-surface-sunken p-3">
                        <div className="mb-1 flex items-start justify-between gap-3">
                          <h4 className="font-medium text-foreground">{meal.name}</h4>
                          <Badge tone="primary">{meal.time}</Badge>
                        </div>
                        <p className="text-sm text-text-body">{meal.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-base font-semibold text-foreground">Dietary recommendations</h3>
                  <ul className="space-y-2">
                    {plan.diet?.recommendations?.map((r, i) => (
                      <li key={i} className="flex items-start text-sm text-text-body">
                        <Check className="mr-2 mt-0.5 size-4 flex-shrink-0 text-success" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
                {plan.diet?.restrictions?.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-base font-semibold text-foreground">Dietary restrictions</h3>
                    <ul className="space-y-2">
                      {plan.diet.restrictions.map((r, i) => (
                        <li key={i} className="flex items-start text-sm text-text-body">
                          <Check className="mr-2 mt-0.5 size-4 flex-shrink-0 text-success" />{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Weekly schedule</CardTitle>
                <CardDescription>Your day-by-day fitness and nutrition plan.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(plan.weekly_routine || {}).map(([day, routine], i) => (
                    <div key={i} className="overflow-hidden rounded-md border border-border">
                      <div className="flex items-center gap-3 bg-surface-sunken p-3">
                        <CalendarDays className="size-5 text-primary" />
                        <h3 className="font-medium capitalize text-foreground">{day}</h3>
                      </div>
                      <div className="space-y-4 p-4">
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-foreground">Workouts</h4>
                          {routine?.workouts?.length ? (
                            <ul className="space-y-1">
                              {routine.workouts.map((w, wi) => (
                                <li key={wi} className="flex items-start text-sm text-text-body">
                                  <Check className="mr-2 mt-0.5 size-4 flex-shrink-0 text-success" />{w}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-text-muted">Rest day — no workouts scheduled.</p>
                          )}
                        </div>
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-foreground">Nutrition</h4>
                          <p className="text-sm text-text-body">{routine?.nutrition}</p>
                        </div>
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-foreground">Recovery</h4>
                          <p className="text-sm text-text-body">{routine?.recovery}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => router.push('/fitness/form')} variant="outline">
            Create a new plan
          </Button>
          <Button onClick={downloadAsPDF} variant="secondary" disabled={isGeneratingPDF}>
            {isGeneratingPDF ? 'Generating…' : 'Download PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
}
