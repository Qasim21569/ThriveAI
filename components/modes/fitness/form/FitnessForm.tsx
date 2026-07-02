'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { FormProgress } from './FormProgress';
import { auth } from '@/lib/firebase/firebaseConfig';
import { savePlan } from '@/lib/firebase/plans';

// Shared warm styling for native <select> controls (matches Input).
const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-surface px-3.5 text-sm text-foreground shadow-xs outline-none transition-colors duration-base ease-standard focus:border-accent focus:ring-[3px] focus:ring-ring/35';

// Form validation schema with more specific validations
const formSchema = z.object({
  // Basic Information
  age: z.string().min(1, 'Age is required')
    .refine(val => !isNaN(Number(val)), 'Age must be a number')
    .refine(val => Number(val) > 0 && Number(val) < 120, 'Age must be between 1 and 120'),
  height: z.string().min(1, 'Height is required')
    .refine(val => !isNaN(Number(val)), 'Height must be a number')
    .refine(val => Number(val) > 0, 'Height must be greater than 0'),
  weight: z.string().min(1, 'Weight is required')
    .refine(val => !isNaN(Number(val)), 'Weight must be a number')
    .refine(val => Number(val) > 0, 'Weight must be greater than 0'),
  gender: z.string().min(1, 'Gender is required'),

  // Fitness Goals
  primaryGoal: z.string().min(1, 'Primary goal is required'),
  timeframe: z.string().min(1, 'Timeframe is required'),

  // Current Fitness Level
  activityLevel: z.string().min(1, 'Activity level is required'),
  experienceLevel: z.string().min(1, 'Experience level is required'),

  // Preferences
  workoutDaysPerWeek: z.string().min(1, 'Workout days is required'),
  workoutDuration: z.string().min(1, 'Workout duration is required'),
  preferredExercises: z.string().min(1, 'Preferred exercises are required'),
  dislikedExercises: z.string().min(1, 'Disliked exercises are required'),
  dietPreference: z.string().min(1, 'Diet preference is required'),

  // Health Considerations
  injuries: z.string().min(1, 'Injuries or limitations are required'),
  healthConditions: z.string().min(1, 'Health conditions are required'),

  // Additional Information
  additionalInfo: z.string().min(1, 'Additional information is required'),
});

// Type for form stages
type FormStage = 'basic' | 'goals' | 'level' | 'preferences' | 'health';

export function FitnessForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<FormStage>('basic');
  const [validStages, setValidStages] = useState<FormStage[]>(['basic']);
  const [formProgress, setFormProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState<string>('');

  // Form init with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: '',
      height: '',
      weight: '',
      gender: 'prefer-not-to-say',
      primaryGoal: '',
      timeframe: '',
      activityLevel: '',
      experienceLevel: '',
      workoutDaysPerWeek: '',
      workoutDuration: '',
      preferredExercises: '',
      dislikedExercises: '',
      dietPreference: 'general',
      injuries: '',
      healthConditions: '',
      additionalInfo: '',
    },
    mode: 'onChange',
  });

  // Watch important fields to validate sections
  const basicFields = form.watch(['age', 'height', 'weight']);
  const goalFields = form.watch(['primaryGoal', 'timeframe']);
  const levelFields = form.watch(['activityLevel', 'experienceLevel']);
  const preferenceFields = form.watch(['workoutDaysPerWeek', 'workoutDuration']);

  // Update valid stages when form fields change
  useEffect(() => {
    const updatedValidStages: FormStage[] = ['basic'];

    // Check if basic info is valid
    const isBasicValid =
      basicFields[0] && !isNaN(Number(basicFields[0])) &&
      basicFields[1] && !isNaN(Number(basicFields[1])) &&
      basicFields[2] && !isNaN(Number(basicFields[2]));

    if (isBasicValid) {
      updatedValidStages.push('goals');

      // Check if goals are valid
      const isGoalsValid =
        goalFields[0] && goalFields[0].length > 0 &&
        goalFields[1] && goalFields[1].length > 0;

      if (isGoalsValid) {
        updatedValidStages.push('level');

        // Check if level is valid
        const isLevelValid =
          levelFields[0] && levelFields[0].length > 0 &&
          levelFields[1] && levelFields[1].length > 0;

        if (isLevelValid) {
          updatedValidStages.push('preferences');

          // Check if preferences are valid
          const isPreferencesValid =
            preferenceFields[0] && preferenceFields[0].length > 0 &&
            preferenceFields[1] && preferenceFields[1].length > 0;

          if (isPreferencesValid) {
            updatedValidStages.push('health');
          }
        }
      }
    }

    setValidStages(updatedValidStages);

    // Skip updating progress if it's the same to avoid infinite renders
    const progress = Math.min(
      Math.round((updatedValidStages.length / 5) * 100),
      100
    );

    if (progress !== formProgress) {
      setFormProgress(progress);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    basicFields[0], basicFields[1], basicFields[2],
    goalFields[0], goalFields[1],
    levelFields[0], levelFields[1],
    preferenceFields[0], preferenceFields[1]
  ]);

  // Form submission handler
  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setGenerationStep('initializing');
    const user = auth.currentUser;

    // Attach the Firebase ID token so the API routes can authenticate the request.
    const idToken = user ? await user.getIdToken() : null;
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) authHeaders['Authorization'] = `Bearer ${idToken}`;

    try {
      // First, let's get the fitness assessment
      setGenerationStep('assessment');
      const assessmentResponse = await fetch('/api/fitness/assessment', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(formData),
      });

      if (!assessmentResponse.ok) {
        console.error("Assessment response error:", assessmentResponse.status, assessmentResponse.statusText);
        const errorData = await assessmentResponse.text();
        console.error("Error details:", errorData);
        throw new Error('Failed to generate fitness assessment');
      }

      const assessmentData = await assessmentResponse.json();

      // Get the fitness plan
      setGenerationStep('plan');
      const planResponse = await fetch('/api/llm', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(formData),
      });

      if (!planResponse.ok) {
        const errorData = await planResponse.text();
        console.error("Plan response error:", planResponse.status, errorData);
        throw new Error('Failed to generate fitness plan');
      }

      const planData = await planResponse.json();

      // Save plan to Firestore subcollection so it gets a stable ID and URL
      setGenerationStep('saving');
      if (user) {
        const planId = await savePlan(user.uid, 'fitness', 'Fitness Plan', planData.plan);
        setGenerationStep('complete');
        toast.success('Your fitness plan is ready!');
        setTimeout(() => router.push(`/fitness/plan/${planId}`), 600);
      } else {
        // Not logged in — store temporarily and go to generic plan page
        localStorage.setItem('fitnessPlan', JSON.stringify(planData.plan));
        setGenerationStep('complete');
        toast.success('Your fitness plan is ready! Sign in to save it permanently.');
        setTimeout(() => router.push('/fitness/plan'), 600);
      }

    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error('There was an error generating your fitness assessment. Please try again.');
      setIsSubmitting(false);
      setGenerationStep('');
    }
  }

  const nextTab = () => {
    if (activeTab === 'basic') setActiveTab('goals');
    else if (activeTab === 'goals') setActiveTab('level');
    else if (activeTab === 'level') setActiveTab('preferences');
    else if (activeTab === 'preferences') setActiveTab('health');
  };

  const prevTab = () => {
    if (activeTab === 'health') setActiveTab('preferences');
    else if (activeTab === 'preferences') setActiveTab('level');
    else if (activeTab === 'level') setActiveTab('goals');
    else if (activeTab === 'goals') setActiveTab('basic');
  };

  // Stage descriptions for context
  const stageDescriptions = {
    basic: "Let's start with the basics to understand your physical profile.",
    goals: "Now tell us about your fitness goals and timeframe.",
    level: "Help us understand your current fitness experience level.",
    preferences: "What are your workout preferences and schedule?",
    health: "Any health considerations we should know about?"
  };

  // Add helper to get loading message based on generation step
  const getLoadingMessage = () => {
    switch (generationStep) {
      case 'initializing':
        return 'Initializing your fitness profile…';
      case 'assessment':
        return 'Creating your personalized fitness assessment…';
      case 'plan':
        return 'Designing your custom fitness plan…';
      case 'saving':
        return 'Saving your fitness program…';
      case 'complete':
        return 'Complete! Redirecting you to your plan…';
      default:
        return 'Processing your fitness information…';
    }
  };

  const progressBars: [string, number][] = [
    [
      'Creating assessment',
      generationStep === 'initializing' ? 5 : generationStep === 'assessment' ? 30 : 100,
    ],
    [
      'Generating plan',
      generationStep === 'initializing' || generationStep === 'assessment'
        ? 0
        : generationStep === 'plan'
        ? 60
        : 100,
    ],
    [
      'Finalizing',
      generationStep === 'initializing' || generationStep === 'assessment' || generationStep === 'plan'
        ? 0
        : generationStep === 'saving'
        ? 80
        : 100,
    ],
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Loading overlay when submitting */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-lg">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="size-16 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />

              <h3 className="text-center text-lg font-semibold text-foreground">
                {getLoadingMessage()}
              </h3>

              <div className="w-full space-y-3">
                {progressBars.map(([label, pct]) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-body">{label}</span>
                      <span className="font-mono text-text-muted">{pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-standard"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="max-w-xs text-center text-sm text-text-muted">
                We&apos;re crafting your personalized fitness program based on your profile. This may
                take a minute.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <FormProgress currentStage={activeTab} setStage={setActiveTab} validStages={validStages} />

      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl md:text-[1.75rem]">
            Your fitness profile
          </CardTitle>
          <CardDescription className="mt-2 text-center text-base">
            {stageDescriptions[activeTab]}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FormStage)} className="w-full">
                <TabsList className="hidden">
                  <TabsTrigger value="basic">Basics</TabsTrigger>
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                  <TabsTrigger value="level">Level</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                  <TabsTrigger value="health">Health</TabsTrigger>
                </TabsList>

                {/* Basic Information */}
                <TabsContent value="basic" className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your age" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <select className={selectClass} value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-binary</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                          </select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (cm)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your height" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your weight" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Fitness Goals */}
                <TabsContent value="goals" className="space-y-6 pt-2">
                  <FormField
                    control={form.control}
                    name="primaryGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary fitness goal</FormLabel>
                        <select className={selectClass} value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                          <option value="">Select your primary goal</option>
                          <option value="weight-loss">Weight loss</option>
                          <option value="muscle-gain">Muscle gain</option>
                          <option value="endurance">Improve endurance</option>
                          <option value="strength">Increase strength</option>
                          <option value="flexibility">Improve flexibility</option>
                          <option value="overall-fitness">Overall fitness</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeframe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goal timeframe</FormLabel>
                        <select className={selectClass} value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                          <option value="">Select your timeframe</option>
                          <option value="1-month">1 month</option>
                          <option value="3-months">3 months</option>
                          <option value="6-months">6 months</option>
                          <option value="1-year">1 year</option>
                          <option value="ongoing">Ongoing / lifestyle</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Current Fitness Level */}
                <TabsContent value="level" className="space-y-6 pt-2">
                  <FormField
                    control={form.control}
                    name="activityLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current activity level</FormLabel>
                        <select className={selectClass} value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                          <option value="">Select your activity level</option>
                          <option value="sedentary">Sedentary (little to no exercise)</option>
                          <option value="lightly-active">Lightly active (light exercise 1-3 days/week)</option>
                          <option value="moderately-active">Moderately active (moderate exercise 3-5 days/week)</option>
                          <option value="very-active">Very active (hard exercise 6-7 days/week)</option>
                          <option value="extremely-active">Extremely active (very hard exercise, physical job or training twice a day)</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exercise experience level</FormLabel>
                        <select className={selectClass} value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                          <option value="">Select your experience level</option>
                          <option value="beginner">Beginner (new to regular exercise)</option>
                          <option value="intermediate">Intermediate (consistent exercise for 6+ months)</option>
                          <option value="advanced">Advanced (experienced, 1+ years of consistent training)</option>
                          <option value="athlete">Athlete (competitive/professional level)</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Preferences */}
                <TabsContent value="preferences" className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="workoutDaysPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Workout days per week</FormLabel>
                          <select className={selectClass} value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                            <option value="">Select days per week</option>
                            <option value="1-2">1-2 days</option>
                            <option value="3-4">3-4 days</option>
                            <option value="5-6">5-6 days</option>
                            <option value="7">Every day</option>
                          </select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workoutDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Workout duration</FormLabel>
                          <select className={selectClass} value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                            <option value="">Select workout duration</option>
                            <option value="15-30">15-30 minutes</option>
                            <option value="30-45">30-45 minutes</option>
                            <option value="45-60">45-60 minutes</option>
                            <option value="60+">60+ minutes</option>
                          </select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dietPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diet preference</FormLabel>
                        <select className={selectClass} value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                          <option value="general">General (no specific preference)</option>
                          <option value="vegetarian">Vegetarian</option>
                          <option value="vegan">Vegan</option>
                          <option value="non-vegetarian">Non-vegetarian</option>
                        </select>
                        <FormDescription>
                          This helps us tailor your nutrition recommendations.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredExercises"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred exercises / activities</FormLabel>
                        <FormControl>
                          <Textarea placeholder="E.g., running, weight lifting, yoga, swimming" {...field} className="resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dislikedExercises"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disliked exercises / activities</FormLabel>
                        <FormControl>
                          <Textarea placeholder="E.g., running, burpees, high-impact exercises" {...field} className="resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Health Considerations */}
                <TabsContent value="health" className="space-y-6 pt-2">
                  <FormField
                    control={form.control}
                    name="injuries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current injuries or physical limitations</FormLabel>
                        <FormControl>
                          <Textarea placeholder="E.g., knee injury, lower back pain, shoulder mobility issues" {...field} className="resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="healthConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relevant health conditions</FormLabel>
                        <FormControl>
                          <Textarea placeholder="E.g., asthma, diabetes, high blood pressure" {...field} className="resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional information</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any other information you'd like to share with your AI coach" {...field} className="resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                {activeTab !== 'basic' ? (
                  <Button type="button" variant="outline" onClick={prevTab}>
                    Previous
                  </Button>
                ) : (
                  <div />
                )}

                {activeTab !== 'health' ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={nextTab}
                    disabled={!validStages.includes(activeTab === 'basic' ? 'goals' : activeTab === 'goals' ? 'level' : activeTab === 'level' ? 'preferences' : 'health')}
                  >
                    Next
                  </Button>
                ) : (
                  <Button type="submit" variant="primary" disabled={isSubmitting || !validStages.includes('health')}>
                    {isSubmitting ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                        Creating…
                      </>
                    ) : (
                      'Build my plan'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="justify-center pt-0 text-center text-sm text-text-muted">
          All your data stays private and is only used to create your personalized fitness plan.
        </CardFooter>
      </Card>
    </div>
  );
}
