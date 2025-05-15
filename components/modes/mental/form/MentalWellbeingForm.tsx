'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FormProgress } from './FormProgress';
import { Checkbox } from '@/components/ui/checkbox';

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
    
    // Check if welcome is completed
    if (userName) {
      updatedValidStages.push('emotionCheck');
      
      // Check if emotion check is completed
      if (currentEmotion) {
        updatedValidStages.push('lifestyle');
        
        // Check if lifestyle info is valid
        const isLifestyleValid = 
          lifestyleFields[0] && lifestyleFields[0].length > 0 && 
          lifestyleFields[1] && lifestyleFields[1].length > 0 &&
          lifestyleFields[2] && lifestyleFields[2].length > 0;
        
        if (isLifestyleValid) {
          updatedValidStages.push('temperament');
          
          // Check if temperament info is valid
          const isTemperamentValid = 
            temperamentFields[0] && temperamentFields[0].length > 0 && 
            temperamentFields[1] && temperamentFields[1].length > 0;
          
          if (isTemperamentValid) {
            updatedValidStages.push('mental');
            
            // Check if mental indicators are valid
            const isMentalValid = 
              mentalFields[0] && mentalFields[0].length > 0 && 
              mentalFields[1] && mentalFields[1].length > 0;
            
            if (isMentalValid) {
              updatedValidStages.push('social');
              
              // Check if social functioning is valid
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
    
    // Only update if validStages actually changed
    if (JSON.stringify(updatedValidStages) !== JSON.stringify(validStages)) {
      setValidStages(updatedValidStages);
    }
    
    // Update progress percentage - now with 7 stages instead of 5
    const progress = Math.min(
      Math.round((updatedValidStages.length / 7) * 100),
      100
    );
    
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
    // Don't include validStages or formProgress in dependencies
  ]);

  // Generate personalized insight based on completed section
  useEffect(() => {
    if (Object.keys(completedSections).length === 0) return;
    
    const newInsights = [];
    const existingInsightTopics = insightMessages.map(msg => {
      if (msg.includes("sleep patterns")) return "sleep";
      if (msg.includes("emotional world")) return "emotion";
      if (msg.includes("anxiety experiences")) return "anxiety";
      if (msg.includes("social experiences")) return "social";
      return "";
    });
    
    if (completedSections.lifestyle && !existingInsightTopics.includes("sleep")) {
      const sleepPattern = form.watch('sleepPattern');
      if (sleepPattern === 'poor' || sleepPattern === 'inconsistent') {
        newInsights.push("I notice your sleep patterns might be affecting your wellbeing. We'll explore this more and find strategies that work for your unique situation.");
      } else {
        newInsights.push("Your sleep habits provide a good foundation. I'm curious about how other aspects of your life interact with your sleep quality.");
      }
    }
    
    if (completedSections.temperament && !existingInsightTopics.includes("emotion")) {
      const emotionalComfort = form.watch('emotionalComfort');
      if (emotionalComfort === 'very-uncomfortable' || emotionalComfort === 'somewhat-uncomfortable') {
        newInsights.push("Difficult emotions can be challenging to sit with. We'll work together on developing emotional resilience in a way that feels supportive for you.");
      } else {
        newInsights.push("I appreciate your openness about your emotional world. This self-awareness is a real strength we can build upon.");
      }
    }
    
    if (completedSections.mental && !existingInsightTopics.includes("anxiety")) {
      const anxietyLevel = form.watch('anxietyLevel');
      if (anxietyLevel === 'moderate' || anxietyLevel === 'severe') {
        newInsights.push("Thank you for sharing about your anxiety experiences. Many people face similar challenges, and there are effective strategies we can explore together.");
      } else {
        newInsights.push("I'm noticing some important patterns in how you experience your thoughts and feelings. This will help us create recommendations that really resonate with you.");
      }
    }
    
    if (completedSections.social && !existingInsightTopics.includes("social")) {
      newInsights.push("Your social experiences provide valuable context. Connection with others is a key factor in wellbeing, and we'll consider your unique social style in your assessment.");
    }
    
    if (newInsights.length > 0) {
      setInsightMessages(prev => [...prev, ...newInsights]);
    }
  }, [completedSections]); // Only depend on completedSections changing

  // Form submission handler
  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setGenerationStep('initializing');
    
    try {
      // Use the mental assessment endpoint
      setGenerationStep('assessment');
      const response = await fetch('/api/mental/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        console.error("Response error:", response.status, response.statusText);
        const errorData = await response.text();
        console.error("Error details:", errorData);
        throw new Error('Failed to generate mental wellbeing assessment');
      }
      
      const data = await response.json();
      
      // Save the assessment to local storage
      setGenerationStep('saving');
      localStorage.setItem('mentalAssessment', JSON.stringify(data.assessment));
      
      // Show success message
      setGenerationStep('complete');
      toast.success('Your mental wellbeing assessment is ready!');
      
      // Show confetti
      setShowConfetti(true);
      
      // Redirect to the report page
      setTimeout(() => {
        router.push('/mental/report');
      }, 1000);
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
      // Mark current section as completed
      if (activeTab !== 'welcome' && activeTab !== 'emotionCheck') {
        setCompletedSections(prev => ({...prev, [activeTab]: true}));
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

  // Function to check if tab is validated
  const isTabValid = (tab: FormStage) => validStages.includes(tab);

  // Get loading message based on generation step
  const getLoadingMessage = () => {
    switch (generationStep) {
      case 'initializing':
        return 'Preparing your assessment...';
      case 'assessment':
        return 'Analyzing your responses and creating personalized insights...';
      case 'saving':
        return 'Finalizing your wellbeing report...';
      case 'complete':
        return 'Complete! Redirecting you to your assessment...';
      default:
        return 'Processing your information...';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Loading overlay */}
      {isSubmitting && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
        >
          <div className="bg-background/60 p-8 rounded-xl border border-blue-500/30 shadow-xl max-w-md w-full">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-t-blue-600 border-r-blue-600 rounded-full animate-spin"></div>
              </div>
              
              <h3 className="text-xl font-medium text-blue-200 text-center">
                {getLoadingMessage()}
              </h3>
              
              <div className="w-full space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">Processing Responses</span>
                    <span className="text-blue-300">
                      {generationStep === 'initializing' ? '20%' : '100%'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-blue-950/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: generationStep === 'initializing' ? '20%' : '100%' 
                      }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">Creating Assessment</span>
                    <span className="text-blue-300">
                      {generationStep === 'initializing' ? '0%' : 
                       generationStep === 'assessment' ? '60%' : '100%'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-blue-950/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: generationStep === 'initializing' ? '0%' : 
                               generationStep === 'assessment' ? '60%' : '100%' 
                      }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">Finalizing</span>
                    <span className="text-blue-300">
                      {generationStep === 'initializing' || generationStep === 'assessment' ? '0%' : 
                       generationStep === 'saving' ? '80%' : '100%'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-blue-950/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: generationStep === 'initializing' || generationStep === 'assessment' ? '0%' : 
                               generationStep === 'saving' ? '80%' : '100%' 
                      }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-blue-300/80 text-center max-w-xs">
                We're analyzing your responses to create personalized insights for your mental wellbeing. This will take just a moment.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Form Title and Description */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
          Mental Wellbeing Assessment
        </h1>
        <p className="mt-3 text-slate-300 max-w-2xl mx-auto">
          This assessment will help you understand your mental wellbeing patterns and provide personalized insights and recommendations.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <FormProgress progress={formProgress} />
      </div>

      {/* Insight Messages */}
      {insightMessages.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="p-5 rounded-lg border border-blue-400/30 bg-blue-500/10">
            <h3 className="text-lg font-medium text-blue-300 mb-2">Insights as we go</h3>
            <div className="space-y-2">
              {insightMessages.map((message, index) => (
                <motion.p 
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 * index }}
                  className="text-slate-300"
                >
                  {message}
                </motion.p>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border border-blue-500/20 shadow-lg bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-blue-400">
                {activeTab === 'welcome' && "Welcome"}
                {activeTab === 'emotionCheck' && "How are you feeling right now?"}
                {activeTab === 'lifestyle' && "Lifestyle & Physical Health"}
                {activeTab === 'temperament' && "Temperament & Emotional Regulation"}
                {activeTab === 'mental' && "Mental Health Indicators"}
                {activeTab === 'social' && "Social Functioning"}
                {activeTab === 'additional' && "Additional Information"}
              </CardTitle>
              <CardDescription>
                {activeTab === 'welcome' && "Let's start with a personal greeting to make this assessment more meaningful for you."}
                {activeTab === 'emotionCheck' && "Checking in with your current emotional state helps us understand your baseline."}
                {activeTab === 'lifestyle' && "Let's understand your daily habits that affect your wellbeing."}
                {activeTab === 'temperament' && "How you experience and express emotions in your daily life."}
                {activeTab === 'mental' && "Understanding your mental health patterns and experiences."}
                {activeTab === 'social' && "How you interact with others and navigate social situations."}
                {activeTab === 'additional' && "Additional details to help personalize your assessment."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Welcome Tab */}
              {activeTab === 'welcome' && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      What should I call you? 
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full p-3 rounded-md border border-blue-500/30 bg-background/80 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your name or what you'd like to be called"
                    />
                    <p className="mt-2 text-sm text-slate-400">
                      This helps me personalize your assessment. I'll use this name throughout our conversation.
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <p className="text-slate-300">
                      I'm here to help you gain insight into your mental wellbeing. This assessment isn't about diagnosing problems but about understanding patterns, strengths, and areas where you might want support.
                    </p>
                    <p className="mt-3 text-slate-300">
                      As we go through these questions, try to be as honest as possible. There are no "right" answers - just what's true for you right now.
                    </p>
                  </div>
                </div>
              )}

              {/* Emotion Check Tab */}
              {activeTab === 'emotionCheck' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Hi {userName}, how are you feeling right now? (Choose one word that best describes your current emotional state)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {['Calm', 'Happy', 'Sad', 'Anxious', 'Tired', 'Frustrated', 'Hopeful', 'Confused', 'Excited', 'Stressed', 'Neutral', 'Other'].map((emotion) => (
                        <div 
                          key={emotion}
                          onClick={() => {
                            if (emotion === 'Other') {
                              setCurrentEmotion('Other');
                            } else {
                              setCurrentEmotion(emotion);
                            }
                          }}
                          className={`p-3 rounded-md border cursor-pointer transition-all ${
                            currentEmotion === emotion 
                              ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                              : 'border-blue-500/30 hover:border-blue-500/60'
                          }`}
                        >
                          {emotion}
                        </div>
                      ))}
                    </div>
                    
                    {currentEmotion === 'Other' && (
                      <input
                        type="text"
                        onChange={(e) => {
                          if (e.target.value) {
                            setCurrentEmotion(e.target.value);
                          } else {
                            setCurrentEmotion('Other');
                          }
                        }}
                        className="mt-3 w-full p-3 rounded-md border border-blue-500/30 bg-background/80 text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe your feeling in one word"
                      />
                    )}
                  </div>
                  
                  {currentEmotion && currentEmotion !== 'Other' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="pt-2"
                    >
                      <label className="block text-sm font-medium mb-2">
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
                        <div className="flex justify-between mt-1 text-xs text-slate-400">
                          <span>Barely noticeable</span>
                          <span>Moderate</span>
                          <span>Very intense</span>
                        </div>
                      </div>
                      <div className="mt-4 p-4 rounded-md bg-slate-800/50 border border-slate-700">
                        <p className="text-slate-300">
                          Thanks for sharing. I'll keep in mind that you're feeling <span className="font-medium text-blue-400">{currentEmotion.toLowerCase()}</span> right now. 
                          Our emotional state can color how we see our experiences, so this context is helpful.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Lifestyle & Physical Health Tab */}
              {activeTab === 'lifestyle' && (
                <div className="space-y-6">
                  {/* Sleep Patterns */}
                  <FormField
                    control={form.control}
                    name="sleepPattern"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your sleep patterns?</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="consistent" />
                              </FormControl>
                              <FormLabel className="font-normal">Consistent (7-9 hours nightly)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="moderate" />
                              </FormControl>
                              <FormLabel className="font-normal">Moderately consistent (5-7 hours)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="inconsistent" />
                              </FormControl>
                              <FormLabel className="font-normal">Inconsistent or difficulty falling asleep</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="poor" />
                              </FormControl>
                              <FormLabel className="font-normal">Poor (under 5 hours or frequent waking)</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Meal Frequency */}
                  <FormField
                    control={form.control}
                    name="mealFrequency"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How regularly do you eat meals?</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="regular" />
                              </FormControl>
                              <FormLabel className="font-normal">Regular meals at consistent times</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="mostly" />
                              </FormControl>
                              <FormLabel className="font-normal">Mostly regular with occasional skipping</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="irregular" />
                              </FormControl>
                              <FormLabel className="font-normal">Irregular meal times or frequent skipping</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="very-irregular" />
                              </FormControl>
                              <FormLabel className="font-normal">Very irregular eating patterns</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Caffeine Intake */}
                  <FormField
                    control={form.control}
                    name="caffeineIntake"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your caffeine intake?</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="none" />
                              </FormControl>
                              <FormLabel className="font-normal">None</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="light" />
                              </FormControl>
                              <FormLabel className="font-normal">Light (1 cup of coffee/tea daily)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="moderate" />
                              </FormControl>
                              <FormLabel className="font-normal">Moderate (2-3 cups daily)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="heavy" />
                              </FormControl>
                              <FormLabel className="font-normal">Heavy (4+ cups or energy drinks)</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Smoking Habits */}
                  <FormField
                    control={form.control}
                    name="smokingHabit"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Do you smoke tobacco or use nicotine products?</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="no" />
                              </FormControl>
                              <FormLabel className="font-normal">No, never</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="occasionally" />
                              </FormControl>
                              <FormLabel className="font-normal">Occasionally (social smoking)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="regularly" />
                              </FormControl>
                              <FormLabel className="font-normal">Regularly (daily)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="heavily" />
                              </FormControl>
                              <FormLabel className="font-normal">Heavily (multiple times daily)</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Alcohol Consumption */}
                  <FormField
                    control={form.control}
                    name="alcoholConsumption"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your alcohol consumption?</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="none" />
                              </FormControl>
                              <FormLabel className="font-normal">None</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="occasional" />
                              </FormControl>
                              <FormLabel className="font-normal">Occasional (few times a month)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="moderate" />
                              </FormControl>
                              <FormLabel className="font-normal">Moderate (weekly)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="frequent" />
                              </FormControl>
                              <FormLabel className="font-normal">Frequent (multiple times a week)</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Add a reflective question at the end of the section */}
                  <div className="mt-8 p-4 rounded-md bg-slate-800/50 border border-slate-700">
                    <p className="text-slate-300">
                      <span className="font-medium text-blue-400">Reflective moment:</span> Have you noticed any connections between your physical habits (like sleep, eating, caffeine) and your mental wellbeing? What patterns have you observed?
                    </p>
                    <textarea
                      className="mt-3 w-full p-3 rounded-md border border-blue-500/30 bg-background/80 text-white resize-none min-h-[80px]"
                      placeholder="This is optional, but can help you gain personal insights..."
                    />
                  </div>
                </div>
              )}

              {/* Temperament & Emotional Regulation Tab */}
              {activeTab === 'temperament' && (
                <div className="space-y-6">
                  {/* Day-to-day Temperament */}
                  <FormField
                    control={form.control}
                    name="dayToDay"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your day-to-day temperament?</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="calm" />
                              </FormControl>
                              <FormLabel className="font-normal">Generally calm and even-tempered</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="moderate" />
                              </FormControl>
                              <FormLabel className="font-normal">Moderate ups and downs</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="reactive" />
                              </FormControl>
                              <FormLabel className="font-normal">Reactive to daily stressors</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="volatile" />
                              </FormControl>
                              <FormLabel className="font-normal">Significant mood changes throughout the day</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Emotional Expression */}
                  <FormField
                    control={form.control}
                    name="emotionalExpression"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How easily do you express your emotions to others?</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="very-comfortable" />
                              </FormControl>
                              <FormLabel className="font-normal">Very comfortable sharing most emotions</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="somewhat-comfortable" />
                              </FormControl>
                              <FormLabel className="font-normal">Comfortable with some emotions, not all</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="selective" />
                              </FormControl>
                              <FormLabel className="font-normal">Only express emotions to select people</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="difficult" />
                              </FormControl>
                              <FormLabel className="font-normal">Difficult expressing emotions to others</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Emotional Comfort */}
                  <FormField
                    control={form.control}
                    name="emotionalComfort"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How comfortable are you with experiencing difficult emotions?</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="very-comfortable" />
                              </FormControl>
                              <FormLabel className="font-normal">Very comfortable - I can sit with uncomfortable feelings</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="moderately-comfortable" />
                              </FormControl>
                              <FormLabel className="font-normal">Moderately comfortable - depends on the emotion</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="somewhat-uncomfortable" />
                              </FormControl>
                              <FormLabel className="font-normal">Somewhat uncomfortable - I try to avoid difficult feelings</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="very-uncomfortable" />
                              </FormControl>
                              <FormLabel className="font-normal">Very uncomfortable - I actively avoid difficult emotions</FormLabel>
                            </FormItem>
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
                  {/* Anxiety Levels */}
                  <FormField
                    control={form.control}
                    name="anxietyLevel"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you rate your general anxiety levels?</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="minimal" />
                              </FormControl>
                              <FormLabel className="font-normal">Minimal - rarely feel anxious</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="mild" />
                              </FormControl>
                              <FormLabel className="font-normal">Mild - occasional anxiety in stressful situations</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="moderate" />
                              </FormControl>
                              <FormLabel className="font-normal">Moderate - regular anxiety that's noticeable</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="severe" />
                              </FormControl>
                              <FormLabel className="font-normal">Severe - frequent, intense anxiety</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Physical Anxiety Symptoms */}
                  <FormField
                    control={form.control}
                    name="physicalAnxiety"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Do you experience physical symptoms of anxiety?</FormLabel>
                        <FormDescription className="text-gray-400">
                          Such as racing heart, sweating, trembling, dizziness, nausea, etc.
                        </FormDescription>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="rarely" />
                              </FormControl>
                              <FormLabel className="font-normal">Rarely or never</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="occasionally" />
                              </FormControl>
                              <FormLabel className="font-normal">Occasionally (monthly)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="frequently" />
                              </FormControl>
                              <FormLabel className="font-normal">Frequently (weekly)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="very-frequently" />
                              </FormControl>
                              <FormLabel className="font-normal">Very frequently (daily)</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Intrusive Thoughts */}
                  <FormField
                    control={form.control}
                    name="intrusiveThoughts"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Do you experience unwanted, intrusive thoughts that cause distress?</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="rarely" />
                              </FormControl>
                              <FormLabel className="font-normal">Rarely or never</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="sometimes" />
                              </FormControl>
                              <FormLabel className="font-normal">Sometimes, but I can manage them</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="often" />
                              </FormControl>
                              <FormLabel className="font-normal">Often and find them distressing</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="frequently" />
                              </FormControl>
                              <FormLabel className="font-normal">Frequently and significantly impacts me</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Thought Patterns */}
                  <FormField
                    control={form.control}
                    name="thoughtPatterns"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your general thought patterns?</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="optimistic" />
                              </FormControl>
                              <FormLabel className="font-normal">Mostly optimistic and positive</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="balanced" />
                              </FormControl>
                              <FormLabel className="font-normal">Balanced between positive and negative</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="worried" />
                              </FormControl>
                              <FormLabel className="font-normal">Tend toward worry and overthinking</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="negative" />
                              </FormControl>
                              <FormLabel className="font-normal">Often negative or self-critical</FormLabel>
                            </FormItem>
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
                  {/* Familiar Settings */}
                  <FormField
                    control={form.control}
                    name="familiarSettings"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your comfort level in familiar social settings?</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="very-comfortable" />
                              </FormControl>
                              <FormLabel className="font-normal">Very comfortable - I enjoy socializing</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="comfortable" />
                              </FormControl>
                              <FormLabel className="font-normal">Comfortable - I do well in most situations</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="somewhat-uncomfortable" />
                              </FormControl>
                              <FormLabel className="font-normal">Somewhat uncomfortable - I prefer small groups</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="uncomfortable" />
                              </FormControl>
                              <FormLabel className="font-normal">Uncomfortable - I avoid most social situations</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Unfamiliar Settings */}
                  <FormField
                    control={form.control}
                    name="unfamiliarSettings"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How would you describe your comfort level in new or unfamiliar social settings?</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="very-comfortable" />
                              </FormControl>
                              <FormLabel className="font-normal">Very comfortable - I adapt quickly</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="initial-discomfort" />
                              </FormControl>
                              <FormLabel className="font-normal">Initial discomfort, then I adjust</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="significant-anxiety" />
                              </FormControl>
                              <FormLabel className="font-normal">Significant anxiety in new situations</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="avoid" />
                              </FormControl>
                              <FormLabel className="font-normal">I try to avoid new social situations</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Additional Information Tab - Enhanced */}
              {activeTab === 'additional' && (
                <div className="space-y-6">
                  {/* Stressors */}
                  <FormField
                    control={form.control}
                    name="stressors"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>What are your major sources of stress currently?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Work demands, relationships, health concerns, etc."
                            className="resize-none min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Coping Strategies */}
                  <FormField
                    control={form.control}
                    name="copingStrategies"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>What strategies do you use to cope with stress or difficult emotions?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Exercise, talking with friends, meditation, creative outlets, etc."
                            className="resize-none min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Additional Information */}
                  <FormField
                    control={form.control}
                    name="additionalInfo"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Anything else you'd like to share about your mental wellbeing?</FormLabel>
                        <FormDescription className="text-gray-400">
                          This is optional but helps provide a more personalized assessment.
                        </FormDescription>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional context, concerns, or goals..."
                            className="resize-none min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Add a strengths section */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">
                      What personal strengths do you draw on when facing challenges?
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                      {['Creativity', 'Resilience', 'Humor', 'Persistence', 'Compassion', 'Analytical thinking', 'Adaptability', 'Self-awareness', 'Courage'].map((strength) => (
                        <div key={strength} className="flex items-center space-x-2">
                          <Checkbox id={`strength-${strength}`} />
                          <label
                            htmlFor={`strength-${strength}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {strength}
                          </label>
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="w-full p-3 rounded-md border border-blue-500/30 bg-background/80 text-white"
                      placeholder="Other strengths..."
                    />
                  </div>
                  
                  {/* Add a personalized closing */}
                  <div className="mt-6 p-4 rounded-md bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20">
                    <p className="text-slate-200">
                      {userName ? `${userName}, t` : "T"}hank you for sharing your experiences with me. Your openness will help me create a personalized assessment that reflects your unique situation and needs. In a moment, I'll analyze your responses and generate insights that I hope will resonate with your lived experience.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Navigation Buttons */}
            <CardFooter className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevTab}
                disabled={activeTab === 'welcome'}
                className="w-[120px]"
              >
                Previous
              </Button>

              <div className="flex gap-3">
                {activeTab === 'additional' ? (
                  <Button 
                    type="submit" 
                    className="w-[180px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={isSubmitting || !isTabValid('additional')}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⊚</span>
                        Processing...
                      </>
                    ) : (
                      `Create My Assessment`
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={nextTab}
                    disabled={
                      (activeTab === 'welcome' && !userName) ||
                      (activeTab === 'emotionCheck' && !currentEmotion) ||
                      (activeTab === 'lifestyle' && !isTabValid('temperament')) ||
                      (activeTab === 'temperament' && !isTabValid('mental')) ||
                      (activeTab === 'mental' && !isTabValid('social')) ||
                      (activeTab === 'social' && !isTabValid('additional'))
                    }
                    className="w-[120px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {activeTab === 'welcome' || activeTab === 'emotionCheck' ? "Begin" : "Next"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {/* Progress Information */}
      <div className="mt-6 text-center text-slate-400 text-sm">
        <p>Your responses are confidential and used only to generate your personalized assessment.</p>
      </div>
    </div>
  );
} 