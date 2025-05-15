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
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FormProgress } from './FormProgress';
import { auth } from '@/lib/firebase/firebaseConfig';
import { savePlanToUserProfile } from '@/lib/firebase/userService';

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
  const [showConfetti, setShowConfetti] = useState(false);
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
  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setGenerationStep('initializing');
    const user = auth.currentUser;
    
    try {
      // Convert fitnessGoals array to string if it exists
      if (formData.fitnessGoals && Array.isArray(formData.fitnessGoals)) {
        formData.fitnessGoals = formData.fitnessGoals.join(', ');
      }
      
      // First, let's get the fitness assessment
      setGenerationStep('assessment');
      const assessmentResponse = await fetch('/api/fitness/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!assessmentResponse.ok) {
        console.error("Assessment response error:", assessmentResponse.status, assessmentResponse.statusText);
        const errorData = await assessmentResponse.text();
        console.error("Error details:", errorData);
        throw new Error('Failed to generate fitness assessment');
      }
      
      const assessmentData = await assessmentResponse.json();
      
      // Save assessment to local storage
      localStorage.setItem('fitnessAssessment', JSON.stringify(assessmentData.assessment));
      
      // Then, get the fitness plan
      setGenerationStep('plan');
      const planResponse = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!planResponse.ok) {
        console.error("Plan response error:", planResponse.status, planResponse.statusText);
        const errorData = await planResponse.text();
        console.error("Error details:", errorData);
        throw new Error('Failed to generate fitness plan');
      }
      
      const planData = await planResponse.json();
      
      // Save the fitness plan to local storage
      localStorage.setItem('fitnessPlan', JSON.stringify(planData.plan));
      
      // If user is logged in, save to Firebase
      setGenerationStep('saving');
      if (user) {
        try {
          // Save assessment
          const assessmentSaveResult = await savePlanToUserProfile(user.uid, {
            id: `fitness-assessment-${Date.now()}`,
            type: 'fitness-assessment',
            path: '/fitness/assessment',
            title: 'Fitness Assessment',
            assessment: assessmentData.assessment,
            createdAt: new Date().toISOString()
          });
          
          // Save plan
          const planSaveResult = await savePlanToUserProfile(user.uid, {
            id: `fitness-plan-${Date.now()}`,
            type: 'fitness-plan',
            path: '/fitness/plan',
            title: 'Fitness Plan',
            plan: planData.plan,
            createdAt: new Date().toISOString()
          });
          
          if (assessmentSaveResult && planSaveResult) {
            toast.success('Your fitness assessment and plan have been saved to your profile!');
          } else {
            toast.error('There was an issue saving to your profile. Your plan is still available locally.');
          }
        } catch (firebaseError) {
          console.error("Firebase save error:", firebaseError);
          toast.error('Could not save to your profile. Check your internet connection.');
        }
      }
      
      // Show success message
      setGenerationStep('complete');
      toast.success('Your fitness assessment and plan are ready!');
      
      // Redirect directly to the plan page with reduced delay for a faster experience
      setTimeout(() => {
        router.push('/fitness/plan');
      }, 800);
      
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
        return 'Initializing your fitness profile...';
      case 'assessment':
        return 'Creating your personalized fitness assessment...';
      case 'plan':
        return 'Designing your custom fitness plan...';
      case 'saving':
        return 'Saving your fitness program...';
      case 'complete':
        return 'Complete! Redirecting you to your plan...';
      default:
        return 'Processing your fitness information...';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Show enhanced loading overlay when submitting */}
      {isSubmitting && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
        >
          <div className="bg-background/60 p-8 rounded-xl border border-violet-500/30 shadow-xl max-w-md w-full">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-violet-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-t-violet-600 border-r-violet-600 rounded-full animate-spin"></div>
              </div>
              
              <h3 className="text-xl font-medium text-violet-200 text-center">
                {getLoadingMessage()}
              </h3>
              
              <div className="w-full space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-violet-300">Creating Assessment</span>
                    <span className="text-violet-300">
                      {generationStep === 'initializing' ? '0%' : 
                       generationStep === 'assessment' ? '25%' : '100%'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-violet-950/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: generationStep === 'initializing' ? '5%' : 
                               generationStep === 'assessment' ? '30%' : '100%' 
                      }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-violet-600 rounded-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-violet-300">Generating Plan</span>
                    <span className="text-violet-300">
                      {generationStep === 'initializing' || generationStep === 'assessment' ? '0%' : 
                       generationStep === 'plan' ? '50%' : '100%'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-violet-950/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: generationStep === 'initializing' || generationStep === 'assessment' ? '0%' : 
                               generationStep === 'plan' ? '60%' : '100%' 
                      }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-violet-600 rounded-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-violet-300">Finalizing</span>
                    <span className="text-violet-300">
                      {generationStep === 'initializing' || generationStep === 'assessment' || generationStep === 'plan' ? '0%' : 
                       generationStep === 'saving' ? '75%' : '100%'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-violet-950/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: generationStep === 'initializing' || generationStep === 'assessment' || generationStep === 'plan' ? '0%' : 
                               generationStep === 'saving' ? '80%' : '100%' 
                      }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-violet-600 rounded-full"
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-violet-300/80 text-center max-w-xs">
                We're crafting your personalized fitness program based on your unique profile. This may take a minute.
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Progress Indicator */}
      <FormProgress 
        currentStage={activeTab} 
        setStage={setActiveTab} 
        validStages={validStages} 
      />
      
      <Card className="border border-violet-500/20 shadow-lg shadow-violet-500/20 bg-gradient-to-b from-background/90 to-background/70 backdrop-blur-md overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500/30 via-purple-600/80 to-violet-500/30" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
        
        <CardHeader className="pb-4 relative z-10">
          <CardTitle className="text-2xl md:text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-600">
            Your Fitness Profile
          </CardTitle>
          <CardDescription className="text-center text-violet-200/80 text-base mt-2">
            {stageDescriptions[activeTab]}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-violet-200">Age</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your age" {...field} className="bg-background/40 border-violet-800/50 focus:border-violet-500" />
                          </FormControl>
                          <FormMessage className="text-pink-400" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-violet-200">Gender</FormLabel>
                          <select 
                            className="bg-background/40 border-violet-800/50 focus:border-violet-500 w-full h-9 rounded-md border px-3 py-2 text-sm"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-binary</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                          </select>
                          <FormMessage className="text-pink-400" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-violet-200">Height (cm)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your height" {...field} className="bg-background/40 border-violet-800/50 focus:border-violet-500" />
                          </FormControl>
                          <FormMessage className="text-pink-400" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-violet-200">Weight (kg)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your weight" {...field} className="bg-background/40 border-violet-800/50 focus:border-violet-500" />
                          </FormControl>
                          <FormMessage className="text-pink-400" />
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
                        <FormLabel className="text-violet-200">Primary Fitness Goal</FormLabel>
                          <select 
                            className="bg-background/40 border-violet-800/50 focus:border-violet-500 w-full h-9 rounded-md border px-3 py-2 text-sm"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="">Select your primary goal</option>
                            <option value="weight-loss">Weight Loss</option>
                            <option value="muscle-gain">Muscle Gain</option>
                            <option value="endurance">Improve Endurance</option>
                            <option value="strength">Increase Strength</option>
                            <option value="flexibility">Improve Flexibility</option>
                            <option value="overall-fitness">Overall Fitness</option>
                          </select>
                        <FormMessage className="text-pink-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="timeframe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-violet-200">Goal Timeframe</FormLabel>
                          <select 
                            className="bg-background/40 border-violet-800/50 focus:border-violet-500 w-full h-9 rounded-md border px-3 py-2 text-sm"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="">Select your timeframe</option>
                            <option value="1-month">1 Month</option>
                            <option value="3-months">3 Months</option>
                            <option value="6-months">6 Months</option>
                            <option value="1-year">1 Year</option>
                            <option value="ongoing">Ongoing/Lifestyle</option>
                          </select>
                        <FormMessage className="text-pink-400" />
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
                        <FormLabel className="text-violet-200">Current Activity Level</FormLabel>
                          <select 
                            className="bg-background/40 border-violet-800/50 focus:border-violet-500 w-full h-9 rounded-md border px-3 py-2 text-sm"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="">Select your activity level</option>
                            <option value="sedentary">Sedentary (little to no exercise)</option>
                            <option value="lightly-active">Lightly Active (light exercise 1-3 days/week)</option>
                            <option value="moderately-active">Moderately Active (moderate exercise 3-5 days/week)</option>
                            <option value="very-active">Very Active (hard exercise 6-7 days/week)</option>
                            <option value="extremely-active">Extremely Active (very hard exercise, physical job or training twice a day)</option>
                          </select>
                        <FormMessage className="text-pink-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-violet-200">Exercise Experience Level</FormLabel>
                          <select 
                            className="bg-background/40 border-violet-800/50 focus:border-violet-500 w-full h-9 rounded-md border px-3 py-2 text-sm"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="">Select your experience level</option>
                            <option value="beginner">Beginner (new to regular exercise)</option>
                            <option value="intermediate">Intermediate (consistent exercise for 6+ months)</option>
                            <option value="advanced">Advanced (experienced, 1+ years of consistent training)</option>
                            <option value="athlete">Athlete (competitive/professional level)</option>
                          </select>
                        <FormMessage className="text-pink-400" />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                {/* Preferences */}
                <TabsContent value="preferences" className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="workoutDaysPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-violet-200">Workout Days Per Week</FormLabel>
                          <select 
                            className="bg-background/40 border-violet-800/50 focus:border-violet-500 w-full h-9 rounded-md border px-3 py-2 text-sm"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="">Select days per week</option>
                            <option value="1-2">1-2 days</option>
                            <option value="3-4">3-4 days</option>
                            <option value="5-6">5-6 days</option>
                            <option value="7">Every day</option>
                          </select>
                          <FormMessage className="text-pink-400" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="workoutDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-violet-200">Workout Duration</FormLabel>
                          <select 
                            className="bg-background/40 border-violet-800/50 focus:border-violet-500 w-full h-9 rounded-md border px-3 py-2 text-sm"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="">Select workout duration</option>
                            <option value="15-30">15-30 minutes</option>
                            <option value="30-45">30-45 minutes</option>
                            <option value="45-60">45-60 minutes</option>
                            <option value="60+">60+ minutes</option>
                          </select>
                          <FormMessage className="text-pink-400" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dietPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-violet-200">Diet Preference</FormLabel>
                        <select 
                          className="bg-background/40 border-violet-800/50 focus:border-violet-500 w-full h-9 rounded-md border px-3 py-2 text-sm"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="general">General (No specific preference)</option>
                          <option value="vegetarian">Vegetarian</option>
                          <option value="vegan">Vegan</option>
                          <option value="non-vegetarian">Non-vegetarian</option>
                        </select>
                        <FormDescription className="text-blue-300/70 text-xs mt-1">
                          This helps us tailor your nutrition recommendations.
                        </FormDescription>
                        <FormMessage className="text-pink-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="preferredExercises"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-violet-200">Preferred Exercises/Activities</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="E.g., running, weight lifting, yoga, swimming" 
                            {...field} 
                            className="resize-none bg-background/40 border-violet-800/50 focus:border-violet-500" 
                          />
                        </FormControl>
                        <FormMessage className="text-pink-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dislikedExercises"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-violet-200">Disliked Exercises/Activities</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="E.g., running, burpees, high-impact exercises" 
                            {...field} 
                            className="resize-none bg-background/40 border-violet-800/50 focus:border-violet-500" 
                          />
                        </FormControl>
                        <FormMessage className="text-pink-400" />
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
                        <FormLabel className="text-violet-200">Current Injuries or Physical Limitations</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="E.g., knee injury, lower back pain, shoulder mobility issues" 
                            {...field} 
                            className="resize-none bg-background/40 border-violet-800/50 focus:border-violet-500" 
                          />
                        </FormControl>
                        <FormMessage className="text-pink-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="healthConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-violet-200">Relevant Health Conditions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="E.g., asthma, diabetes, high blood pressure" 
                            {...field} 
                            className="resize-none bg-background/40 border-violet-800/50 focus:border-violet-500" 
                          />
                        </FormControl>
                        <FormMessage className="text-pink-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="additionalInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-violet-200">Additional Information</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any other information you'd like to share with your AI coach" 
                            {...field} 
                            className="resize-none bg-background/40 border-violet-800/50 focus:border-violet-500" 
                          />
                        </FormControl>
                        <FormMessage className="text-pink-400" />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                {activeTab !== 'basic' ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevTab}
                    className="border-violet-500/30 hover:bg-violet-500/10 hover:border-violet-500/50"
                  >
                    Previous
                  </Button>
                ) : (
                  <div></div> // Empty div to maintain layout
                )}
                
                {activeTab !== 'health' ? (
                  <Button 
                    type="button" 
                    onClick={nextTab}
                    disabled={!validStages.includes(activeTab === 'basic' ? 'goals' : activeTab === 'goals' ? 'level' : activeTab === 'level' ? 'preferences' : 'health')}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !validStages.includes('health')}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></div>
                        Creating...
                      </div>
                    ) : (
                      "Submit Form"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="pt-0 pb-6 text-center text-violet-300/60 text-sm relative z-10">
          All your data remains private and is only used to create your personalized fitness plan.
        </CardFooter>
      </Card>
    </motion.div>
  );
}