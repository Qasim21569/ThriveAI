'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  ArrowRight,
  Dumbbell,
  Gauge,
  Target,
  Utensils,
  Activity,
  TriangleAlert,
  Lightbulb,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/firebase/firebaseConfig';
import { savePlanToUserProfile } from '@/lib/firebase/userService';
import { useToast } from '@/components/ui/use-toast';

// Define interfaces for the assessment data
interface FitnessAssessment {
  greeting: string;
  overview: {
    summary: string;
    strengths: string[];
    areas_to_improve: string[];
  };
  physical_assessment: {
    body_composition: { score: string; summary: string; recommendations: string[] };
    current_fitness: { score: string; summary: string; recommendations: string[] };
  };
  goal_assessment: {
    goal_feasibility: string;
    timeframe_analysis: string;
    personalized_goals: string[];
  };
  training_recommendations: {
    workout_types: string[];
    frequency: string;
    intensity: string;
    progression: string[];
  };
  nutrition_recommendations: {
    diet_type: string;
    meal_structure: string;
    key_nutrients: string[];
    diet_tips: string[];
  };
  action_plan: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };
  health_considerations: {
    cautions: string[];
    modifications: string[];
  };
  personal_insights: string[];
}

// Small helper: bulleted list
function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
          <span className="text-text-body">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function FitnessAssessmentPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<FitnessAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false);
  const [savedToFirebase, setSavedToFirebase] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load assessment from localStorage on component mount
  useEffect(() => {
    setLoading(true);
    try {
      const savedAssessment = localStorage.getItem('fitnessAssessment');
      if (savedAssessment) {
        const parsedAssessment = JSON.parse(savedAssessment);
        setAssessment(parsedAssessment);

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            setSavedToFirebase(false);
          }
        });

        return () => unsubscribe();
      } else {
        setError('No fitness assessment found. Please complete the fitness form first.');
      }
    } catch (e) {
      console.error('Error loading fitness assessment:', e);
      setError('Error loading your fitness assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle saving to Firebase
  const handleSaveToProfile = async () => {
    if (!assessment) return;

    setIsSavingToFirebase(true);
    const user = auth.currentUser;

    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to save your assessment to your profile.',
        variant: 'destructive',
      });
      setIsSavingToFirebase(false);
      return;
    }

    try {
      const result = await savePlanToUserProfile(user.uid, {
        id: `fitness-assessment-${Date.now()}`,
        type: 'fitness-assessment',
        path: '/fitness/assessment',
        title: 'Fitness Assessment',
        assessment: assessment,
        createdAt: new Date().toISOString(),
      });

      if (result) {
        toast({
          title: 'Success!',
          description: 'Your fitness assessment has been saved to your profile.',
        });
        setSavedToFirebase(true);
      } else {
        throw new Error('Failed to save assessment');
      }
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      toast({
        title: 'Error',
        description: 'There was a problem saving your assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingToFirebase(false);
    }
  };

  // View fitness plan
  const viewFitnessPlan = () => {
    router.push('/fitness/plan');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-4">
        <div className="mb-4 size-14 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
        <p className="text-text-muted">Loading your fitness assessment…</p>
      </div>
    );
  }

  // Show error state
  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-app">
          <Card className="p-6">
            <CardTitle>Assessment not found</CardTitle>
            <p className="mt-2 text-text-body">
              {error || 'No assessment data found. Please complete the fitness form first.'}
            </p>
            <Button onClick={() => router.push('/fitness/form')} variant="primary" className="mt-4">
              Go to fitness form
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-content" ref={contentRef}>
        {/* Top Actions */}
        <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-accent">
              Assessment
            </span>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground md:text-3xl">
              Your fitness assessment
            </h1>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSaveToProfile}
              variant={savedToFirebase ? 'secondary' : 'outline'}
              disabled={isSavingToFirebase || savedToFirebase}
            >
              {isSavingToFirebase ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-4" /> {savedToFirebase ? 'Saved' : 'Save to profile'}
                </>
              )}
            </Button>

            <Button onClick={viewFitnessPlan} variant="primary">
              <Dumbbell className="size-4" /> View plan
            </Button>
          </div>
        </div>

        {/* Greeting */}
        <Card className="mb-8 bg-primary-soft p-6">
          <p className="text-lg text-coffee-700">{assessment.greeting}</p>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-1">
            {/* Overview */}
            <Card className="p-6">
              <CardTitle className="text-lg">Overview</CardTitle>
              <div className="mt-4 space-y-4">
                <p className="text-text-body">{assessment.overview.summary}</p>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Your strengths</h3>
                  <ul className="space-y-2">
                    {assessment.overview.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        <span className="text-sm text-text-body">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Areas to focus on</h3>
                  <ul className="space-y-2">
                    {assessment.overview.areas_to_improve.map((area, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                        <span className="text-sm text-text-body">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Health Considerations */}
            <Card className="p-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TriangleAlert className="size-5 text-warning" /> Health considerations
              </CardTitle>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Safety cautions</h3>
                  <Bullets items={assessment.health_considerations.cautions} />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Recommended modifications</h3>
                  <Bullets items={assessment.health_considerations.modifications} />
                </div>
              </div>
            </Card>
          </div>

          {/* Middle Column */}
          <div className="space-y-6 lg:col-span-1">
            {/* Physical Assessment */}
            <Card className="p-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gauge className="size-5 text-primary" /> Physical assessment
              </CardTitle>
              <div className="mt-4 space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Body composition</h3>
                    <Badge tone="primary">{assessment.physical_assessment.body_composition.score}</Badge>
                  </div>
                  <p className="mb-3 text-sm text-text-body">{assessment.physical_assessment.body_composition.summary}</p>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Recommendations</h4>
                  <Bullets items={assessment.physical_assessment.body_composition.recommendations} />
                </div>
                <div className="border-t border-border pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Current fitness level</h3>
                    <Badge tone="primary">{assessment.physical_assessment.current_fitness.score}</Badge>
                  </div>
                  <p className="mb-3 text-sm text-text-body">{assessment.physical_assessment.current_fitness.summary}</p>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Recommendations</h4>
                  <Bullets items={assessment.physical_assessment.current_fitness.recommendations} />
                </div>
              </div>
            </Card>

            {/* Goal Assessment */}
            <Card className="p-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="size-5 text-primary" /> Goal assessment
              </CardTitle>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Goal feasibility</h3>
                  <p className="text-sm text-text-body">{assessment.goal_assessment.goal_feasibility}</p>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Timeframe analysis</h3>
                  <p className="text-sm text-text-body">{assessment.goal_assessment.timeframe_analysis}</p>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Personalized goals</h3>
                  <Bullets items={assessment.goal_assessment.personalized_goals} />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6 lg:col-span-1">
            {/* Training Recommendations */}
            <Card className="p-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Dumbbell className="size-5 text-primary" /> Training recommendations
              </CardTitle>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Recommended workout types</h3>
                  <Bullets items={assessment.training_recommendations.workout_types} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-foreground">Frequency</h3>
                    <p className="text-sm text-text-body">{assessment.training_recommendations.frequency}</p>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-foreground">Intensity</h3>
                    <p className="text-sm text-text-body">{assessment.training_recommendations.intensity}</p>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Progression plan</h3>
                  <Bullets items={assessment.training_recommendations.progression} />
                </div>
              </div>
            </Card>

            {/* Nutrition Recommendations */}
            <Card className="p-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Utensils className="size-5 text-primary" /> Nutrition recommendations
              </CardTitle>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Diet type</h3>
                  <p className="text-sm text-text-body">{assessment.nutrition_recommendations.diet_type}</p>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">Meal structure</h3>
                  <p className="text-sm text-text-body">{assessment.nutrition_recommendations.meal_structure}</p>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Key nutrients</h3>
                  <Bullets items={assessment.nutrition_recommendations.key_nutrients} />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Diet tips</h3>
                  <Bullets items={assessment.nutrition_recommendations.diet_tips} />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Action Plan */}
        <Card className="mt-8 p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="size-5 text-primary" /> Your action plan
            </CardTitle>
            <CardDescription>Practical steps for different timeframes.</CardDescription>
          </CardHeader>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
            {([
              ['Start today', assessment.action_plan.immediate, 'bg-destructive'],
              ['Next 2–4 weeks', assessment.action_plan.short_term, 'bg-warning'],
              ['Beyond 1 month', assessment.action_plan.long_term, 'bg-success'],
            ] as [string, string[], string][]).map(([label, actions, dot]) => (
              <div key={label}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className={`size-2 rounded-full ${dot}`} /> {label}
                </h3>
                <ul className="space-y-2">
                  {actions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2 rounded-md border border-border bg-surface-sunken p-3">
                      <span className="font-mono text-sm font-semibold text-primary">{index + 1}.</span>
                      <span className="text-sm text-text-body">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        {/* Personal Insights */}
        <Card className="mt-8 p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="size-5 text-primary" /> Personal insights
            </CardTitle>
            <CardDescription>Observations about your fitness journey.</CardDescription>
          </CardHeader>
          <div className="mt-4 space-y-3">
            {assessment.personal_insights.map((insight, index) => (
              <div key={index} className="rounded-md border border-border bg-surface-sunken p-4">
                <p className="italic text-text-body">&ldquo;{insight}&rdquo;</p>
              </div>
            ))}
          </div>
          <CardFooter className="mt-6 p-0">
            <Button onClick={viewFitnessPlan} variant="primary" className="w-full">
              View your complete fitness plan <ArrowRight className="size-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
