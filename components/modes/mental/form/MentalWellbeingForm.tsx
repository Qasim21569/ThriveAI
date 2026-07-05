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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FormProgress } from './FormProgress';
import { Checkbox } from '@/components/ui/checkbox';
import { auth } from '@/lib/firebase/firebaseConfig';
import { savePlan } from '@/lib/firebase/plans';
import { runExtraction } from '@/lib/coach/extraction-client';
import { getLifeModel } from '@/lib/firebase/lifeModel';
import { emptyLifeModel } from '@/lib/lifemodel/types';

// Shared warm styling for native text controls (matches Input).
const nativeInputClass =
  'w-full rounded-md border border-input bg-surface p-3 text-sm text-foreground shadow-xs outline-none transition-colors duration-base ease-standard focus:border-accent focus:ring-[3px] focus:ring-ring/35';

// Form validation schema
const formSchema = z.object({
  // Lifestyle and Physical Health
  sleepPattern: z.string().min(1, 'Sleep pattern is required'),
  mealFrequency: z.string().min(1, 'Meal frequency is required'),
  caffeineIntake: z.string().min(1, 'Caffeine intake is required'),
  smokingHabit: z.string().min(1, 'Smoking habit is required'),
  alcoholConsumption: z.string().min(1, 'Alcohol consumption is required'),

  // Temperament and Emotional Regulation
  dayToDay: z.string().min(1, 'Day to day temperament is required'),
  emotionalExpression: z.string().min(1, 'Emotional expression is required'),
  emotionalComfort: z.string().min(1, 'Emotional comfort is required'),

  // Mental Health Indicators
  anxietyLevel: z.string().min(1, 'Anxiety level is required'),
  physicalAnxiety: z.string().min(1, 'Physical symptoms is required'),
  intrusiveThoughts: z.string().min(1, 'Intrusive thoughts is required'),
  thoughtPatterns: z.string().min(1, 'Thought patterns is required'),

  // Social Functioning
  familiarSettings: z.string().min(1, 'Social comfort in familiar settings is required'),
  unfamiliarSettings: z.string().min(1, 'Social comfort in unfamiliar settings is required'),

  // Additional Information
  additionalInfo: z.string().optional(),
  stressors: z.string().min(1, 'Major stressors is required'),
  copingStrategies: z.string().min(1, 'Coping strategies is required'),
});

// Type for form stages
type FormStage = 'welcome' | 'emotionCheck' | 'lifestyle' | 'temperament' | 'mental' | 'social' | 'additional';

// Radio option helper — keeps the many option lists compact and consistent.
function RadioOption({ value, label }: { value: string; label: string }) {
  return (
    <FormItem className="flex items-center space-x-3 space-y-0">
      <FormControl>
        <RadioGroupItem value={value} />
      </FormControl>
      <FormLabel className="font-normal">{label}</FormLabel>
    </FormItem>
  );
}

export function MentalWellbeingForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<FormStage>('welcome');
  const [validStages, setValidStages] = useState<FormStage[]>(['welcome']);
  const [formProgress, setFormProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentEmotion, setCurrentEmotion] = useState('');
  const [emotionIntensity, setEmotionIntensity] = useState(50);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const [insightMessages, setInsightMessages] = useState<string[]>([]);
  const [generationStep, setGenerationStep] = useState<string>('');

  // Form init with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sleepPattern: '',
      mealFrequency: '',
      caffeineIntake: '',
      smokingHabit: '',
      alcoholConsumption: '',
      dayToDay: '',
      emotionalExpression: '',
      emotionalComfort: '',
      anxietyLevel: '',
      physicalAnxiety: '',
      intrusiveThoughts: '',
      thoughtPatterns: '',
      familiarSettings: '',
      unfamiliarSettings: '',
      additionalInfo: '',
      stressors: '',
      copingStrategies: '',
    },
    mode: 'onChange',
  });

  // Watch important fields to validate sections
  const lifestyleFields = form.watch(['sleepPattern', 'mealFrequency', 'caffeineIntake']);
  const temperamentFields = form.watch(['dayToDay', 'emotionalExpression']);
  const mentalFields = form.watch(['anxietyLevel', 'physicalAnxiety']);
  const socialFields = form.watch(['familiarSettings', 'unfamiliarSettings']);

  // Update valid stages when form fields change
  useEffect(() => {
    const updatedValidStages: FormStage[] = ['welcome'];

    if (userName) {
      updatedValidStages.push('emotionCheck');

      if (currentEmotion) {
        updatedValidStages.push('lifestyle');

        const isLifestyleValid =
          lifestyleFields[0] && lifestyleFields[0].length > 0 &&
          lifestyleFields[1] && lifestyleFields[1].length > 0 &&
          lifestyleFields[2] && lifestyleFields[2].length > 0;

        if (isLifestyleValid) {
          updatedValidStages.push('temperament');

          const isTemperamentValid =
            temperamentFields[0] && temperamentFields[0].length > 0 &&
            temperamentFields[1] && temperamentFields[1].length > 0;

          if (isTemperamentValid) {
            updatedValidStages.push('mental');

            const isMentalValid =
              mentalFields[0] && mentalFields[0].length > 0 &&
              mentalFields[1] && mentalFields[1].length > 0;

            if (isMentalValid) {
              updatedValidStages.push('social');

              const isSocialValid =
                socialFields[0] && socialFields[0].length > 0 &&
                socialFields[1] && socialFields[1].length > 0;

              if (isSocialValid) {
                updatedValidStages.push('additional');
              }
            }
          }
        }
      }
    }

    if (JSON.stringify(updatedValidStages) !== JSON.stringify(validStages)) {
      setValidStages(updatedValidStages);
    }

    const progress = Math.min(Math.round((updatedValidStages.length / 7) * 100), 100);

    if (progress !== formProgress) {
      setFormProgress(progress);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userName,
    currentEmotion,
    lifestyleFields[0], lifestyleFields[1], lifestyleFields[2],
    temperamentFields[0], temperamentFields[1],
    mentalFields[0], mentalFields[1],
    socialFields[0], socialFields[1],
  ]);

  // Generate personalized insight based on completed section
  useEffect(() => {
    if (Object.keys(completedSections).length === 0) return;

    const newInsights: string[] = [];
    const existingInsightTopics = insightMessages.map((msg) => {
      if (msg.includes('sleep patterns')) return 'sleep';
      if (msg.includes('emotional world')) return 'emotion';
      if (msg.includes('anxiety experiences')) return 'anxiety';
      if (msg.includes('social experiences')) return 'social';
      return '';
    });

    if (completedSections.lifestyle && !existingInsightTopics.includes('sleep')) {
      const sleepPattern = form.watch('sleepPattern');
      if (sleepPattern === 'poor' || sleepPattern === 'inconsistent') {
        newInsights.push("I notice your sleep patterns might be affecting your wellbeing. We'll explore this more and find strategies that work for your unique situation.");
      } else {
        newInsights.push("Your sleep habits provide a good foundation. I'm curious about how other aspects of your life interact with your sleep quality.");
      }
    }

    if (completedSections.temperament && !existingInsightTopics.includes('emotion')) {
      const emotionalComfort = form.watch('emotionalComfort');
      if (emotionalComfort === 'very-uncomfortable' || emotionalComfort === 'somewhat-uncomfortable') {
        newInsights.push("Difficult emotions can be challenging to sit with. We'll work together on developing emotional resilience in a way that feels supportive for you.");
      } else {
        newInsights.push("I appreciate your openness about your emotional world. This self-awareness is a real strength we can build upon.");
      }
    }

    if (completedSections.mental && !existingInsightTopics.includes('anxiety')) {
      const anxietyLevel = form.watch('anxietyLevel');
      if (anxietyLevel === 'moderate' || anxietyLevel === 'severe') {
        newInsights.push('Thank you for sharing about your anxiety experiences. Many people face similar challenges, and there are effective strategies we can explore together.');
      } else {
        newInsights.push("I'm noticing some important patterns in how you experience your thoughts and feelings. This will help us create recommendations that really resonate with you.");
      }
    }

    if (completedSections.social && !existingInsightTopics.includes('social')) {
      newInsights.push('Your social experiences provide valuable context. Connection with others is a key factor in wellbeing, and we\'ll consider your unique social style in your assessment.');
    }

    if (newInsights.length > 0) {
      setInsightMessages((prev) => [...prev, ...newInsights]);
    }
  }, [completedSections]); // Only depend on completedSections changing

  // Form submission handler
  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setGenerationStep('initializing');

    // Attach the Firebase ID token so the API route can authenticate the request.
    const user = auth.currentUser;
    const idToken = user ? await user.getIdToken() : null;
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) authHeaders['Authorization'] = `Bearer ${idToken}`;

    try {
      setGenerationStep('assessment');
      const response = await fetch('/api/mental/assessment', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        console.error('Response error:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error details:', errorData);
        throw new Error('Failed to generate mental wellbeing assessment');
      }

      const data = await response.json();

      setGenerationStep('saving');
      setGenerationStep('complete');
      toast.success('Your mental wellbeing assessment is ready!');
      setShowConfetti(true);

      if (user) {
        const planId = await savePlan(user.uid, 'mental', 'Mental Wellbeing Assessment', data.assessment);
        // Distill the assessment into the brain's mental area (fire-and-forget).
        void (async () => {
          try {
            const idToken = await user.getIdToken();
            const model = (await getLifeModel(user.uid)) ?? emptyLifeModel();
            const text =
              'The user just completed a mental wellbeing assessment. Key findings (JSON): ' +
              JSON.stringify(data.assessment).slice(0, 3000);
            await runExtraction(user.uid, idToken, model, text);
          } catch (error) {
            console.error('Mental assessment distillation failed:', error);
          }
        })();
        setTimeout(() => router.push(`/mental/report/${planId}`), 1000);
      } else {
        // Not signed in — fall back to localStorage + the non-permanent report page
        localStorage.setItem('mentalAssessment', JSON.stringify(data.assessment));
        setTimeout(() => router.push('/mental/report'), 1000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to generate your assessment. Please try again.');
      setGenerationStep('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation functions
  const nextTab = () => {
    const currentIndex = validStages.indexOf(activeTab);
    if (currentIndex < validStages.length - 1) {
      if (activeTab !== 'welcome' && activeTab !== 'emotionCheck') {
        setCompletedSections((prev) => ({ ...prev, [activeTab]: true }));
      }
      setActiveTab(validStages[currentIndex + 1]);
    }
  };

  const prevTab = () => {
    const currentIndex = validStages.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(validStages[currentIndex - 1]);
    }
  };

  const isTabValid = (tab: FormStage) => validStages.includes(tab);

  const getLoadingMessage = () => {
    switch (generationStep) {
      case 'initializing':
        return 'Preparing your assessment…';
      case 'assessment':
        return 'Analyzing your responses and creating personalized insights…';
      case 'saving':
        return 'Finalizing your wellbeing report…';
      case 'complete':
        return 'Complete! Redirecting you to your assessment…';
      default:
        return 'Processing your information…';
    }
  };

  const loadingBars: [string, number][] = [
    ['Processing responses', generationStep === 'initializing' ? 20 : 100],
    ['Creating assessment', generationStep === 'initializing' ? 0 : generationStep === 'assessment' ? 60 : 100],
    [
      'Finalizing',
      generationStep === 'initializing' || generationStep === 'assessment' ? 0 : generationStep === 'saving' ? 80 : 100,
    ],
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Loading overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-lg">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="size-16 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />

              <h3 className="text-center text-lg font-semibold text-foreground">{getLoadingMessage()}</h3>

              <div className="w-full space-y-3">
                {loadingBars.map(([label, pct]) => (
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
                We&apos;re analyzing your responses to create personalized insights for your mental
                wellbeing. This will take just a moment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Title and Description */}
      <div className="mb-8 text-center">
        <h2 className="font-serif text-2xl font-semibold text-foreground md:text-[1.75rem]">
          Mental wellbeing assessment
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-text-muted">
          This assessment helps you understand your wellbeing patterns and offers personalized
          insights and recommendations.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <FormProgress progress={formProgress} />
      </div>

      {/* Insight Messages */}
      {insightMessages.length > 0 && (
        <div className="mb-8">
          <div className="rounded-lg border border-accent/25 bg-accent-soft p-5">
            <h3 className="mb-2 text-base font-semibold text-terracotta-600">Insights as we go</h3>
            <div className="space-y-2">
              {insightMessages.map((message, index) => (
                <p key={index} className="text-sm text-text-body">
                  {message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'welcome' && 'Welcome'}
                {activeTab === 'emotionCheck' && 'How are you feeling right now?'}
                {activeTab === 'lifestyle' && 'Lifestyle & physical health'}
                {activeTab === 'temperament' && 'Temperament & emotional regulation'}
                {activeTab === 'mental' && 'Mental health indicators'}
                {activeTab === 'social' && 'Social functioning'}
                {activeTab === 'additional' && 'Additional information'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'welcome' && "Let's start with a personal greeting to make this assessment more meaningful for you."}
                {activeTab === 'emotionCheck' && 'Checking in with your current emotional state helps us understand your baseline.'}
                {activeTab === 'lifestyle' && "Let's understand your daily habits that affect your wellbeing."}
                {activeTab === 'temperament' && 'How you experience and express emotions in your daily life.'}
                {activeTab === 'mental' && 'Understanding your mental health patterns and experiences.'}
                {activeTab === 'social' && 'How you interact with others and navigate social situations.'}
                {activeTab === 'additional' && 'Additional details to help personalize your assessment.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Welcome Tab */}
              {activeTab === 'welcome' && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                      What should I call you?
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className={nativeInputClass}
                      placeholder="Your name or what you'd like to be called"
                    />
                    <p className="mt-2 text-sm text-text-muted">
                      This helps me personalize your assessment. I&apos;ll use this name throughout our conversation.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 text-text-body">
                    <p>
                      I&apos;m here to help you gain insight into your mental wellbeing. This assessment
                      isn&apos;t about diagnosing problems but about understanding patterns, strengths, and
                      areas where you might want support.
                    </p>
                    <p>
                      As we go through these questions, try to be as honest as possible. There are no
                      &ldquo;right&rdquo; answers — just what&apos;s true for you right now.
                    </p>
                  </div>
                </div>
              )}

              {/* Emotion Check Tab */}
              {activeTab === 'emotionCheck' && (
                <div className="space-y-6">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-foreground">
                      Hi {userName}, how are you feeling right now? (Choose one word that best describes your current emotional state)
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {['Calm', 'Happy', 'Sad', 'Anxious', 'Tired', 'Frustrated', 'Hopeful', 'Confused', 'Excited', 'Stressed', 'Neutral', 'Other'].map((emotion) => (
                        <div
                          key={emotion}
                          onClick={() => setCurrentEmotion(emotion === 'Other' ? 'Other' : emotion)}
                          className={`cursor-pointer rounded-md border p-3 text-sm transition-colors duration-base ease-standard ${
                            currentEmotion === emotion
                              ? 'border-accent bg-accent-soft text-terracotta-600'
                              : 'border-border text-text-body hover:border-border-strong'
                          }`}
                        >
                          {emotion}
                        </div>
                      ))}
                    </div>

                    {currentEmotion === 'Other' && (
                      <input
                        type="text"
                        onChange={(e) => setCurrentEmotion(e.target.value || 'Other')}
                        className={`mt-3 ${nativeInputClass}`}
                        placeholder="Describe your feeling in one word"
                      />
                    )}
                  </div>

                  {currentEmotion && currentEmotion !== 'Other' && (
                    <div className="pt-2">
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        How intense is this feeling? ({emotionIntensity}%)
                      </label>
                      <div className="py-4">
                        <Slider
                          value={[emotionIntensity]}
                          min={1}
                          max={100}
                          step={1}
                          onValueChange={(value) => setEmotionIntensity(value[0])}
                        />
                        <div className="mt-1 flex justify-between text-xs text-text-muted">
                          <span>Barely noticeable</span>
                          <span>Moderate</span>
                          <span>Very intense</span>
                        </div>
                      </div>
                      <div className="mt-4 rounded-md border border-border bg-surface-sunken p-4">
                        <p className="text-text-body">
                          Thanks for sharing. I&apos;ll keep in mind that you&apos;re feeling{' '}
                          <span className="font-medium text-accent">{currentEmotion.toLowerCase()}</span> right
                          now. Our emotional state can color how we see our experiences, so this context is
                          helpful.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lifestyle & Physical Health Tab */}
              {activeTab === 'lifestyle' && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="sleepPattern"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your sleep patterns?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="consistent" label="Consistent (7-9 hours nightly)" />
                            <RadioOption value="moderate" label="Moderately consistent (5-7 hours)" />
                            <RadioOption value="inconsistent" label="Inconsistent or difficulty falling asleep" />
                            <RadioOption value="poor" label="Poor (under 5 hours or frequent waking)" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mealFrequency"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How regularly do you eat meals?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="regular" label="Regular meals at consistent times" />
                            <RadioOption value="mostly" label="Mostly regular with occasional skipping" />
                            <RadioOption value="irregular" label="Irregular meal times or frequent skipping" />
                            <RadioOption value="very-irregular" label="Very irregular eating patterns" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="caffeineIntake"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your caffeine intake?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="none" label="None" />
                            <RadioOption value="light" label="Light (1 cup of coffee/tea daily)" />
                            <RadioOption value="moderate" label="Moderate (2-3 cups daily)" />
                            <RadioOption value="heavy" label="Heavy (4+ cups or energy drinks)" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smokingHabit"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Do you smoke tobacco or use nicotine products?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="no" label="No, never" />
                            <RadioOption value="occasionally" label="Occasionally (social smoking)" />
                            <RadioOption value="regularly" label="Regularly (daily)" />
                            <RadioOption value="heavily" label="Heavily (multiple times daily)" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alcoholConsumption"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your alcohol consumption?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="none" label="None" />
                            <RadioOption value="occasional" label="Occasional (few times a month)" />
                            <RadioOption value="moderate" label="Moderate (weekly)" />
                            <RadioOption value="frequent" label="Frequent (multiple times a week)" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-8 rounded-md border border-border bg-surface-sunken p-4">
                    <p className="text-text-body">
                      <span className="font-medium text-accent">Reflective moment:</span> Have you noticed any
                      connections between your physical habits (like sleep, eating, caffeine) and your mental
                      wellbeing? What patterns have you observed?
                    </p>
                    <textarea
                      className={`mt-3 min-h-[80px] resize-none ${nativeInputClass}`}
                      placeholder="This is optional, but can help you gain personal insights…"
                    />
                  </div>
                </div>
              )}

              {/* Temperament Tab */}
              {activeTab === 'temperament' && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="dayToDay"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your day-to-day temperament?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="calm" label="Generally calm and even-tempered" />
                            <RadioOption value="moderate" label="Moderate ups and downs" />
                            <RadioOption value="reactive" label="Reactive to daily stressors" />
                            <RadioOption value="volatile" label="Significant mood changes throughout the day" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emotionalExpression"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How easily do you express your emotions to others?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="very-comfortable" label="Very comfortable sharing most emotions" />
                            <RadioOption value="somewhat-comfortable" label="Comfortable with some emotions, not all" />
                            <RadioOption value="selective" label="Only express emotions to select people" />
                            <RadioOption value="difficult" label="Difficult expressing emotions to others" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emotionalComfort"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How comfortable are you with experiencing difficult emotions?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="very-comfortable" label="Very comfortable - I can sit with uncomfortable feelings" />
                            <RadioOption value="moderately-comfortable" label="Moderately comfortable - depends on the emotion" />
                            <RadioOption value="somewhat-uncomfortable" label="Somewhat uncomfortable - I try to avoid difficult feelings" />
                            <RadioOption value="very-uncomfortable" label="Very uncomfortable - I actively avoid difficult emotions" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Mental Health Indicators Tab */}
              {activeTab === 'mental' && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="anxietyLevel"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you rate your general anxiety levels?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="minimal" label="Minimal - rarely feel anxious" />
                            <RadioOption value="mild" label="Mild - occasional anxiety in stressful situations" />
                            <RadioOption value="moderate" label="Moderate - regular anxiety that's noticeable" />
                            <RadioOption value="severe" label="Severe - frequent, intense anxiety" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="physicalAnxiety"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Do you experience physical symptoms of anxiety?</FormLabel>
                        <FormDescription>
                          Such as racing heart, sweating, trembling, dizziness, nausea, etc.
                        </FormDescription>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="rarely" label="Rarely or never" />
                            <RadioOption value="occasionally" label="Occasionally (monthly)" />
                            <RadioOption value="frequently" label="Frequently (weekly)" />
                            <RadioOption value="very-frequently" label="Very frequently (daily)" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intrusiveThoughts"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Do you experience unwanted, intrusive thoughts that cause distress?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="rarely" label="Rarely or never" />
                            <RadioOption value="sometimes" label="Sometimes, but I can manage them" />
                            <RadioOption value="often" label="Often and find them distressing" />
                            <RadioOption value="frequently" label="Frequently and significantly impacts me" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thoughtPatterns"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your general thought patterns?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="optimistic" label="Mostly optimistic and positive" />
                            <RadioOption value="balanced" label="Balanced between positive and negative" />
                            <RadioOption value="worried" label="Tend toward worry and overthinking" />
                            <RadioOption value="negative" label="Often negative or self-critical" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Social Functioning Tab */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="familiarSettings"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your comfort level in familiar social settings?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="very-comfortable" label="Very comfortable - I enjoy socializing" />
                            <RadioOption value="comfortable" label="Comfortable - I do well in most situations" />
                            <RadioOption value="somewhat-uncomfortable" label="Somewhat uncomfortable - I prefer small groups" />
                            <RadioOption value="uncomfortable" label="Uncomfortable - I avoid most social situations" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unfamiliarSettings"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your comfort level in new or unfamiliar social settings?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <RadioOption value="very-comfortable" label="Very comfortable - I adapt quickly" />
                            <RadioOption value="initial-discomfort" label="Initial discomfort, then I adjust" />
                            <RadioOption value="significant-anxiety" label="Significant anxiety in new situations" />
                            <RadioOption value="avoid" label="I try to avoid new social situations" />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Additional Information Tab */}
              {activeTab === 'additional' && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="stressors"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>What are your major sources of stress currently?</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Work demands, relationships, health concerns, etc." className="min-h-[100px] resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="copingStrategies"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>What strategies do you use to cope with stress or difficult emotions?</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Exercise, talking with friends, meditation, creative outlets, etc." className="min-h-[100px] resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalInfo"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Anything else you&apos;d like to share about your mental wellbeing?</FormLabel>
                        <FormDescription>
                          This is optional but helps provide a more personalized assessment.
                        </FormDescription>
                        <FormControl>
                          <Textarea placeholder="Any additional context, concerns, or goals…" className="min-h-[100px] resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Strengths section */}
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      What personal strengths do you draw on when facing challenges?
                    </label>
                    <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-3">
                      {['Creativity', 'Resilience', 'Humor', 'Persistence', 'Compassion', 'Analytical thinking', 'Adaptability', 'Self-awareness', 'Courage'].map((strength) => (
                        <div key={strength} className="flex items-center space-x-2">
                          <Checkbox id={`strength-${strength}`} />
                          <label htmlFor={`strength-${strength}`} className="text-sm font-medium leading-none text-text-body">
                            {strength}
                          </label>
                        </div>
                      ))}
                    </div>
                    <input type="text" className={nativeInputClass} placeholder="Other strengths…" />
                  </div>

                  {/* Personalized closing */}
                  <div className="mt-6 rounded-md border border-primary/15 bg-primary-soft p-4">
                    <p className="text-text-body">
                      {userName ? `${userName}, t` : 'T'}hank you for sharing your experiences with me. Your
                      openness will help me create a personalized assessment that reflects your unique situation
                      and needs. In a moment, I&apos;ll analyze your responses and generate insights that I hope
                      will resonate with your lived experience.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Navigation Buttons */}
            <CardFooter className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={prevTab} disabled={activeTab === 'welcome'} className="w-[120px]">
                Previous
              </Button>

              <div className="flex gap-3">
                {activeTab === 'additional' ? (
                  <Button type="submit" variant="primary" className="w-[180px]" disabled={isSubmitting || !isTabValid('additional')}>
                    {isSubmitting ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                        Processing…
                      </>
                    ) : (
                      'Create my assessment'
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={nextTab}
                    disabled={
                      (activeTab === 'welcome' && !userName) ||
                      (activeTab === 'emotionCheck' && !currentEmotion) ||
                      (activeTab === 'lifestyle' && !isTabValid('temperament')) ||
                      (activeTab === 'temperament' && !isTabValid('mental')) ||
                      (activeTab === 'mental' && !isTabValid('social')) ||
                      (activeTab === 'social' && !isTabValid('additional'))
                    }
                    className="w-[120px]"
                  >
                    {activeTab === 'welcome' || activeTab === 'emotionCheck' ? 'Begin' : 'Next'}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {/* Progress Information */}
      <div className="mt-6 text-center text-sm text-text-muted">
        <p>Your responses are confidential and used only to generate your personalized assessment.</p>
      </div>
    </div>
  );
}
