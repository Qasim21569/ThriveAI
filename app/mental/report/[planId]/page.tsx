'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CircleCheck,
  TriangleAlert,
  Coffee,
  Smile,
  Brain,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { auth } from '@/lib/firebase/firebaseConfig';
import { getPlan } from '@/lib/firebase/plans';

interface MentalAssessment {
  greeting?: string;
  overview: { summary: string; strengths: string[]; challenges: string[] };
  areas: {
    lifestyle: { score: string; summary: string; recommendations: string[] };
    emotional: { score: string; summary: string; recommendations: string[] };
    mental: { score: string; summary: string; recommendations: string[] };
    social: { score: string; summary: string; recommendations: string[] };
  };
  recommendations: { immediate: string[]; short_term: string[]; long_term: string[] };
  resources: { practices: string[]; support: string[] };
  action_plan?: { today: string[]; this_week: string[]; this_month: string[]; ongoing: string[] };
  personal_insights?: string[];
}

function getScoreColor(score: string): string {
  const scoreMap: Record<string, string> = {
    excellent: 'text-success',
    good: 'text-success',
    moderate: 'text-warning',
    developing: 'text-warning',
    functional: 'text-warning',
    'needs attention': 'text-destructive',
    'needs development': 'text-destructive',
    'needs support': 'text-destructive',
    challenging: 'text-destructive',
    poor: 'text-destructive',
  };
  const lower = score.toLowerCase();
  for (const [key, color] of Object.entries(scoreMap)) {
    if (lower.includes(key)) return color;
  }
  return 'text-accent';
}

const tabTriggerClass = 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs';

function RecoList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((rec, i) => (
        <li key={i} className="flex items-start gap-2 rounded-md border border-border bg-surface-sunken p-3">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
          <span className="text-sm text-text-body">{rec}</span>
        </li>
      ))}
    </ul>
  );
}

function AreaCard({ Icon, title, area }: { Icon: LucideIcon; title: string; area: { score: string; summary: string; recommendations: string[] } }) {
  return (
    <div className="rounded-md border border-border bg-surface-sunken p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Icon className="size-5 text-primary" /> {title}
        </h3>
        <span className={`font-mono text-sm font-medium ${getScoreColor(area.score)}`}>{area.score}</span>
      </div>
      <p className="mb-4 text-sm text-text-body">{area.summary}</p>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Recommendations</h4>
      <ul className="space-y-1.5">
        {area.recommendations.map((rec, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text-body">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MentalReportPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const [assessment, setAssessment] = useState<MentalAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setError('Please sign in to view this assessment.');
        setLoading(false);
        return;
      }
      try {
        const record = await getPlan(user.uid, planId);
        if (!record) {
          setError('Assessment not found. It may have been deleted or belongs to another account.');
          setLoading(false);
          return;
        }
        setAssessment(record.data as unknown as MentalAssessment);
      } catch (err) {
        console.error('Error loading mental assessment:', err);
        setError('Failed to load your assessment. Please try again.');
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, [planId]);

  const downloadAsPDF = () => {
    toast.info('PDF export is not implemented yet for mental wellbeing reports.');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
          <p className="text-text-muted">Loading your assessment…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto max-w-lg text-center">
          <p className="mb-6 text-text-body">{error}</p>
          <Button onClick={() => router.push('/mental/form')} variant="primary">Start a new assessment</Button>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-content" ref={contentRef}>
        <div className="mb-8">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="size-4" /> Back to dashboard
          </Button>
        </div>

        <div className="mb-10 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-accent">Your report</span>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.015em] text-foreground md:text-4xl">
            Your mental wellbeing assessment
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-text-muted">
            Based on your responses, here are your personalized insights and recommendations.
          </p>
        </div>

        <Tabs defaultValue="overview" className="mx-auto w-full max-w-app">
          <TabsList className="mb-8 grid grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="overview" className={tabTriggerClass}>Overview</TabsTrigger>
            <TabsTrigger value="areas" className={tabTriggerClass}>Key areas</TabsTrigger>
            <TabsTrigger value="recommendations" className={tabTriggerClass}>Recommendations</TabsTrigger>
            <TabsTrigger value="resources" className={tabTriggerClass}>Resources</TabsTrigger>
            <TabsTrigger value="action" className={tabTriggerClass}>Action plan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Assessment overview</CardTitle>
                <CardDescription>A summary of your mental wellbeing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-md border border-border bg-surface-sunken p-4">
                  <p className="text-text-body">{assessment.overview.summary}</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                      <CircleCheck className="size-5 text-success" /> Your strengths
                    </h3>
                    <ul className="space-y-2">
                      {assessment.overview.strengths.map((s, i) => (
                        <li key={i} className="rounded-md border border-border bg-surface-sunken p-3 text-sm text-text-body">{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                      <TriangleAlert className="size-5 text-warning" /> Your challenges
                    </h3>
                    <ul className="space-y-2">
                      {assessment.overview.challenges.map((c, i) => (
                        <li key={i} className="rounded-md border border-border bg-surface-sunken p-3 text-sm text-text-body">{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="areas">
            <Card>
              <CardHeader>
                <CardTitle>Key areas assessment</CardTitle>
                <CardDescription>Detailed analysis of different aspects of your wellbeing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <AreaCard Icon={Coffee} title="Lifestyle & physical health" area={assessment.areas.lifestyle} />
                <AreaCard Icon={Smile} title="Emotional regulation" area={assessment.areas.emotional} />
                <AreaCard Icon={Brain} title="Mental health" area={assessment.areas.mental} />
                <AreaCard Icon={Users} title="Social functioning" area={assessment.areas.social} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle>Personalized recommendations</CardTitle>
                <CardDescription>Targeted suggestions to enhance your wellbeing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-3 text-base font-semibold text-foreground">Start today</h3>
                  <RecoList items={assessment.recommendations.immediate} />
                </div>
                <div>
                  <h3 className="mb-3 text-base font-semibold text-foreground">This week</h3>
                  <RecoList items={assessment.recommendations.short_term} />
                </div>
                <div>
                  <h3 className="mb-3 text-base font-semibold text-foreground">Ongoing practice</h3>
                  <RecoList items={assessment.recommendations.long_term} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>Supportive resources</CardTitle>
                <CardDescription>Tools, practices, and support systems.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-3 text-base font-semibold text-foreground">Recommended practices</h3>
                  <RecoList items={assessment.resources.practices} />
                </div>
                <div>
                  <h3 className="mb-3 text-base font-semibold text-foreground">Support options</h3>
                  <RecoList items={assessment.resources.support} />
                </div>
                <div className="rounded-md border border-border bg-surface-sunken p-4">
                  <p className="text-sm text-text-muted">
                    <strong className="text-text-body">Note:</strong> This assessment is for informational
                    purposes only and is not a substitute for professional medical advice, diagnosis, or
                    treatment. If you&apos;re experiencing significant mental health challenges, please consult
                    a qualified healthcare provider.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="action">
            <Card>
              <CardHeader>
                <CardTitle>Your action plan</CardTitle>
                <CardDescription>A structured approach to improving your wellbeing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-md border border-border bg-surface-sunken p-4">
                  <p className="text-sm text-text-body">
                    Focus on implementing one or two recommendations at a time rather than trying to change
                    everything at once.
                  </p>
                </div>
                <div>
                  <h3 className="mb-3 text-base font-semibold text-foreground">Today</h3>
                  <RecoList items={assessment.recommendations.immediate.slice(0, 1)} />
                </div>
                <div>
                  <h3 className="mb-3 text-base font-semibold text-foreground">This week</h3>
                  <RecoList items={assessment.recommendations.short_term.slice(0, 2)} />
                </div>
                <div>
                  <h3 className="mb-3 text-base font-semibold text-foreground">This month</h3>
                  <RecoList
                    items={[
                      assessment.areas.lifestyle.recommendations[0],
                      assessment.areas.emotional.recommendations[0],
                    ].filter(Boolean)}
                  />
                </div>
                <div>
                  <h3 className="mb-3 text-base font-semibold text-foreground">Ongoing practice</h3>
                  <RecoList items={assessment.recommendations.long_term.slice(0, 2)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => router.push('/mental/form')} variant="outline">
            Create a new assessment
          </Button>
          <Button onClick={downloadAsPDF} variant="secondary">
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
