'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CircleCheck,
  TriangleAlert,
  Coffee,
  Smile,
  Brain,
  Users,
  Save,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { useToast } from '@/components/ui/use-toast';
import { auth } from '@/lib/firebase/firebaseConfig';
import { savePlanToUserProfile } from '@/lib/firebase/userService';

interface MentalAssessment {
  greeting?: string;
  overview: {
    summary: string;
    strengths: string[];
    challenges: string[];
  };
  areas: {
    lifestyle: { score: string; summary: string; recommendations: string[] };
    emotional: { score: string; summary: string; recommendations: string[] };
    mental: { score: string; summary: string; recommendations: string[] };
    social: { score: string; summary: string; recommendations: string[] };
  };
  recommendations: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };
  resources: {
    practices: string[];
    support: string[];
  };
  action_plan?: {
    today: string[];
    this_week: string[];
    this_month: string[];
    ongoing: string[];
  };
  personal_insights?: string[];
}

export default function MentalWellbeingReportPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<MentalAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false);
  const [savedToFirebase, setSavedToFirebase] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string>('');
  const { toast } = useToast();

  // Load assessment from localStorage on component mount
  useEffect(() => {
    setLoading(true);
    try {
      const savedAssessment = localStorage.getItem('mentalAssessment');
      if (savedAssessment) {
        const parsedAssessment = JSON.parse(savedAssessment);
        setAssessment(parsedAssessment);

        const uniqueId = `mental-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setAssessmentId(uniqueId);

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            const savedIds = localStorage.getItem('savedAssessmentIds');
            if (savedIds) {
              const ids = JSON.parse(savedIds);
              setSavedToFirebase(ids.includes(uniqueId));
            }
          }
        });

        return () => unsubscribe();
      } else {
        setError('No assessment found. Please complete the mental wellbeing assessment first.');
      }
    } catch (e) {
      console.error('Error loading mental wellbeing assessment:', e);
      setError('Error loading your assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save assessment to Firebase
  const saveToFirebase = async (assessmentData: MentalAssessment, userId: string) => {
    if (!assessmentData) return false;

    try {
      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const calculateOverallScore = () => {
        const scores = [
          assessmentData.areas.lifestyle.score,
          assessmentData.areas.emotional.score,
          assessmentData.areas.mental.score,
          assessmentData.areas.social.score,
        ];

        let needsAttention = 0;
        let moderate = 0;
        let good = 0;

        scores.forEach((score) => {
          const lowerScore = score.toLowerCase();
          if (lowerScore.includes('need') || lowerScore.includes('poor') || lowerScore.includes('challenging')) {
            needsAttention++;
          } else if (lowerScore.includes('moderate') || lowerScore.includes('developing') || lowerScore.includes('functional')) {
            moderate++;
          } else {
            good++;
          }
        });

        if (needsAttention >= 2) return 'Needs attention';
        if (needsAttention === 1 && moderate >= 2) return 'Needs attention';
        if (good >= 3) return 'Good';
        return 'Moderate';
      };

      const overallScore = calculateOverallScore();

      const strengthsSummary = assessmentData.overview.strengths.slice(0, 2).join('; ');
      const challengesSummary = assessmentData.overview.challenges.slice(0, 2).join('; ');
      const summaryText = `${strengthsSummary}. Challenges: ${challengesSummary}`;

      const mentalWellbeingPlan = {
        id: assessmentId,
        type: 'mental_wellbeing',
        title: 'Mental Wellbeing Assessment',
        description: `Created on ${formattedDate} | Overall: ${overallScore}`,
        summary: summaryText,
        path: '/mental/report',
        score: overallScore,
        createdAt: new Date().toISOString(),
        fullAssessment: assessmentData,
      };

      const success = await savePlanToUserProfile(userId, mentalWellbeingPlan);

      if (success) {
        const savedIds = localStorage.getItem('savedAssessmentIds');
        let ids = savedIds ? JSON.parse(savedIds) : [];
        ids.push(assessmentId);
        localStorage.setItem('savedAssessmentIds', JSON.stringify(ids));
      }

      return success;
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      return false;
    }
  };

  const handleSaveToProfile = async () => {
    if (!assessment) return;

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save this assessment to your profile',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingToFirebase(true);

    try {
      const success = await saveToFirebase(assessment, user.uid);

      if (success) {
        setSavedToFirebase(true);
        toast({
          title: 'Assessment saved!',
          description: 'Your assessment has been saved to your profile and can be accessed anytime',
        });
      } else {
        throw new Error('Failed to save assessment');
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: 'Failed to save',
        description: 'There was a problem saving your assessment. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingToFirebase(false);
    }
  };

  const downloadAsPDF = async () => {
    if (!contentRef.current) return;
    try {
      toast({
        title: 'PDF download',
        description: 'This feature is not yet implemented',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Map score keywords to warm semantic text colors
  const getScoreColor = (score: string) => {
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

    const lowerScore = score.toLowerCase();
    for (const [key, color] of Object.entries(scoreMap)) {
      if (lowerScore.includes(key)) return color;
    }
    return 'text-accent';
  };

  const tabTriggerClass =
    'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs';

  // Reusable list of recommendations
  const RecoList = ({ items }: { items: string[] }) => (
    <ul className="space-y-2">
      {items.map((rec, index) => (
        <li key={index} className="flex items-start gap-2 rounded-md border border-border bg-surface-sunken p-3">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
          <span className="text-sm text-text-body">{rec}</span>
        </li>
      ))}
    </ul>
  );

  const AreaCard = ({
    Icon,
    title,
    area,
  }: {
    Icon: LucideIcon;
    title: string;
    area: { score: string; summary: string; recommendations: string[] };
  }) => (
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
        {area.recommendations.map((rec, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-text-body">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  // Error / loading states
  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="mx-auto mt-20 max-w-app px-4 text-center">
          <h1 className="mb-6 font-serif text-2xl font-semibold text-foreground md:text-3xl">{error}</h1>
          <Button onClick={() => router.push('/mental/form')} variant="primary">
            Go to assessment form
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
          <p className="text-text-muted">Loading your assessment…</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-content px-4 py-12" ref={contentRef}>
          {/* Back button */}
          <div className="mb-8">
            <Button variant="outline" size="sm" onClick={() => router.push('/mental')}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          </div>

          {/* Header */}
          <div className="mb-10 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-accent">Your report</span>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.015em] text-foreground md:text-4xl">
              Your mental wellbeing assessment
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-text-muted">
              Based on your responses, here are your personalized insights and recommendations.
            </p>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="mx-auto w-full max-w-app">
            <TabsList className="mb-8 grid grid-cols-2 sm:grid-cols-5">
              <TabsTrigger value="overview" className={tabTriggerClass}>Overview</TabsTrigger>
              <TabsTrigger value="areas" className={tabTriggerClass}>Key areas</TabsTrigger>
              <TabsTrigger value="recommendations" className={tabTriggerClass}>Recommendations</TabsTrigger>
              <TabsTrigger value="resources" className={tabTriggerClass}>Resources</TabsTrigger>
              <TabsTrigger value="action" className={tabTriggerClass}>Action plan</TabsTrigger>
            </TabsList>

            {/* Overview */}
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
                        {assessment.overview.strengths.map((strength, index) => (
                          <li key={index} className="rounded-md border border-border bg-surface-sunken p-3 text-sm text-text-body">
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                        <TriangleAlert className="size-5 text-warning" /> Your challenges
                      </h3>
                      <ul className="space-y-2">
                        {assessment.overview.challenges.map((challenge, index) => (
                          <li key={index} className="rounded-md border border-border bg-surface-sunken p-3 text-sm text-text-body">
                            {challenge}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Key Areas */}
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

            {/* Recommendations */}
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

            {/* Resources */}
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

            {/* Action Plan */}
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

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => router.push('/mental/form')} variant="outline">
              Back to assessment
            </Button>
            <Button onClick={downloadAsPDF} variant="secondary">
              Download PDF
            </Button>
            <Button onClick={handleSaveToProfile} variant="primary" disabled={isSavingToFirebase || savedToFirebase}>
              {isSavingToFirebase ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                  Saving…
                </>
              ) : savedToFirebase ? (
                <>
                  <CircleCheck className="size-4" /> Saved to profile
                </>
              ) : (
                <>
                  <Save className="size-4" /> Save to profile
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
