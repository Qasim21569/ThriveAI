'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { auth } from '@/lib/firebase/firebaseConfig';
import { savePlanToUserProfile } from '@/lib/firebase/userService';
import { useToast } from '@/components/ui/use-toast';
import SaveIcon from '@mui/icons-material/Save';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SpeedIcon from '@mui/icons-material/Speed';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TimelineIcon from '@mui/icons-material/Timeline';
import WarningIcon from '@mui/icons-material/Warning';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

// Define interfaces for the assessment data
interface FitnessAssessment {
  // Overview
  greeting: string;
  overview: {
    summary: string;
    strengths: string[];
    areas_to_improve: string[];
  };

  // Physical Assessment
  physical_assessment: {
    body_composition: {
      score: string;
      summary: string;
      recommendations: string[];
    };
    current_fitness: {
      score: string;
      summary: string;
      recommendations: string[];
    };
  };

  // Goal Assessment
  goal_assessment: {
    goal_feasibility: string;
    timeframe_analysis: string;
    personalized_goals: string[];
  };

  // Recommendations
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

  // Action Plan
  action_plan: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };

  // Additional Information
  health_considerations: {
    cautions: string[];
    modifications: string[];
  };

  // Personal insights
  personal_insights: string[];
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

        // Check if the user is authenticated
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            // Check if already saved
            setSavedToFirebase(false); // We'll assume it's not saved initially
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
        title: "Not logged in",
        description: "Please log in to save your assessment to your profile.",
        variant: "destructive"
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
        createdAt: new Date().toISOString()
      });

      if (result) {
        toast({
          title: "Success!",
          description: "Your fitness assessment has been saved to your profile.",
        });
        setSavedToFirebase(true);
      } else {
        throw new Error("Failed to save assessment");
      }
    } catch (error) {
      console.error("Error saving to Firebase:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your assessment. Please try again.",
        variant: "destructive"
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
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-4 border-t-violet-500 border-violet-200 rounded-full animate-spin mb-4"></div>
        <p className="text-lg text-violet-200">Loading your fitness assessment...</p>
      </div>
    );
  }

  // Show error state
  if (error || !assessment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border border-red-500/30 bg-red-900/10">
          <CardHeader>
            <CardTitle className="text-red-300">Assessment Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">{error || 'No assessment data found. Please complete the fitness form first.'}</p>
            <Button
              onClick={() => router.push('/fitness/form')}
              className="mt-4 bg-violet-600 hover:bg-violet-700"
            >
              Go to Fitness Form
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" ref={contentRef}>
      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-600">
          Your Fitness Assessment
        </h1>

        <div className="flex space-x-3">
          <Button
            onClick={handleSaveToProfile}
            disabled={isSavingToFirebase || savedToFirebase}
            className={`${savedToFirebase
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-violet-600 hover:bg-violet-700'
              }`}
          >
            {isSavingToFirebase ? (
              <>
                <div className="w-4 h-4 border-2 border-t-white/20 border-white rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : savedToFirebase ? (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Save to Profile
              </>
            )}
          </Button>

          <Button
            onClick={viewFitnessPlan}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <FitnessCenterIcon className="mr-2 h-4 w-4" />
            View Plan
          </Button>
        </div>
      </div>

      {/* Greeting */}
      <Card className="mb-8 border border-violet-500/20 bg-gradient-to-b from-background/90 to-background/70 backdrop-blur-sm">
        <CardContent className="p-6">
          <p className="text-lg text-violet-100">{assessment.greeting}</p>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border border-violet-500/20 bg-background/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-violet-300">Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">{assessment.overview.summary}</p>

                {/* Strengths */}
                <div>
                  <h3 className="text-md font-medium text-violet-200 mb-2">Your Strengths</h3>
                  <ul className="space-y-2">
                    {assessment.overview.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block p-1 bg-green-500/20 text-green-300 rounded-full mr-2 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="text-slate-300">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas to Improve */}
                <div>
                  <h3 className="text-md font-medium text-violet-200 mb-2">Areas to Focus On</h3>
                  <ul className="space-y-2">
                    {assessment.overview.areas_to_improve.map((area, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block p-1 bg-amber-500/20 text-amber-300 rounded-full mr-2 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10a1 1 0 11-2 0V4a1 1 0 011-1z" />
                            <path fillRule="evenodd" d="M10 18a1 1 0 100-2 1 1 0 000 2z" />
                          </svg>
                        </span>
                        <span className="text-slate-300">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Health Considerations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border border-amber-500/20 bg-amber-900/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-amber-300 flex items-center">
                  <WarningIcon className="mr-2 h-5 w-5" />
                  Health Considerations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cautions */}
                <div>
                  <h3 className="text-md font-medium text-amber-200 mb-2">Safety Cautions</h3>
                  <ul className="space-y-2">
                    {assessment.health_considerations.cautions.map((caution, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block p-1 bg-red-500/20 text-red-300 rounded-full mr-2 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="text-slate-300">{caution}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Modifications */}
                <div>
                  <h3 className="text-md font-medium text-amber-200 mb-2">Recommended Modifications</h3>
                  <ul className="space-y-2">
                    {assessment.health_considerations.modifications.map((modification, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block p-1 bg-blue-500/20 text-blue-300 rounded-full mr-2 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="text-slate-300">{modification}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Middle Column - Physical and Goal Assessment */}
        <div className="lg:col-span-1 space-y-6">
          {/* Physical Assessment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border border-blue-500/20 bg-blue-900/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-blue-300 flex items-center">
                  <SpeedIcon className="mr-2 h-5 w-5" />
                  Physical Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Body Composition */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium text-blue-200">Body Composition</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                      {assessment.physical_assessment.body_composition.score}
                    </span>
                  </div>
                  <p className="text-slate-300 mb-3">{assessment.physical_assessment.body_composition.summary}</p>

                  <h4 className="text-sm font-medium text-blue-200 mb-2">Recommendations:</h4>
                  <ul className="space-y-1 text-sm">
                    {assessment.physical_assessment.body_composition.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        <span className="text-slate-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-blue-500/20 pt-4">
                  {/* Current Fitness */}
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium text-blue-200">Current Fitness Level</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                      {assessment.physical_assessment.current_fitness.score}
                    </span>
                  </div>
                  <p className="text-slate-300 mb-3">{assessment.physical_assessment.current_fitness.summary}</p>

                  <h4 className="text-sm font-medium text-blue-200 mb-2">Recommendations:</h4>
                  <ul className="space-y-1 text-sm">
                    {assessment.physical_assessment.current_fitness.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        <span className="text-slate-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Goal Assessment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border border-purple-500/20 bg-purple-900/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-purple-300 flex items-center">
                  <TrackChangesIcon className="mr-2 h-5 w-5" />
                  Goal Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-purple-200 mb-1">Goal Feasibility</h3>
                  <p className="text-slate-300 mb-3">{assessment.goal_assessment.goal_feasibility}</p>
                </div>

                <div>
                  <h3 className="text-md font-medium text-purple-200 mb-1">Timeframe Analysis</h3>
                  <p className="text-slate-300 mb-3">{assessment.goal_assessment.timeframe_analysis}</p>
                </div>

                <div>
                  <h3 className="text-md font-medium text-purple-200 mb-2">Personalized Goals</h3>
                  <ul className="space-y-2">
                    {assessment.goal_assessment.personalized_goals.map((goal, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block p-1 bg-purple-500/20 text-purple-300 rounded-full mr-2 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                          </svg>
                        </span>
                        <span className="text-slate-300">{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Training, Nutrition, Action Plan */}
        <div className="lg:col-span-1 space-y-6">
          {/* Training Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border border-green-500/20 bg-green-900/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-green-300 flex items-center">
                  <FitnessCenterIcon className="mr-2 h-5 w-5" />
                  Training Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-green-200 mb-2">Recommended Workout Types</h3>
                  <ul className="space-y-1">
                    {assessment.training_recommendations.workout_types.map((type, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-400 mr-2">•</span>
                        <span className="text-slate-300">{type}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-md font-medium text-green-200 mb-1">Frequency</h3>
                    <p className="text-slate-300">{assessment.training_recommendations.frequency}</p>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-green-200 mb-1">Intensity</h3>
                    <p className="text-slate-300">{assessment.training_recommendations.intensity}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-md font-medium text-green-200 mb-2">Progression Plan</h3>
                  <ul className="space-y-1">
                    {assessment.training_recommendations.progression.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-400 mr-2">•</span>
                        <span className="text-slate-300">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Nutrition Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border border-orange-500/20 bg-orange-900/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-orange-300 flex items-center">
                  <RestaurantIcon className="mr-2 h-5 w-5" />
                  Nutrition Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h3 className="text-md font-medium text-orange-200 mb-1">Diet Type</h3>
                    <p className="text-slate-300">{assessment.nutrition_recommendations.diet_type}</p>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-orange-200 mb-1">Meal Structure</h3>
                    <p className="text-slate-300">{assessment.nutrition_recommendations.meal_structure}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-orange-200 mb-2">Key Nutrients</h3>
                  <ul className="space-y-1">
                    {assessment.nutrition_recommendations.key_nutrients.map((nutrient, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-orange-400 mr-2">•</span>
                        <span className="text-slate-300">{nutrient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-md font-medium text-orange-200 mb-2">Diet Tips</h3>
                  <ul className="space-y-1">
                    {assessment.nutrition_recommendations.diet_tips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-orange-400 mr-2">•</span>
                        <span className="text-slate-300">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Action Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8"
      >
        <Card className="border border-indigo-500/20 bg-indigo-900/5 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-indigo-300 flex items-center">
              <TimelineIcon className="mr-2 h-5 w-5" />
              Your Action Plan
            </CardTitle>
            <CardDescription className="text-slate-400">
              Practical steps to achieve your fitness goals at different timeframes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Immediate Actions */}
              <div>
                <h3 className="text-md font-medium text-indigo-200 mb-3 flex items-center">
                  <span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                  Start Today
                </h3>
                <ul className="space-y-3">
                  {assessment.action_plan.immediate.map((action, index) => (
                    <li key={index} className="flex items-start bg-indigo-900/20 p-3 rounded-md">
                      <span className="text-indigo-300 mr-2 font-bold">{index + 1}.</span>
                      <span className="text-slate-300">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Short-term Actions */}
              <div>
                <h3 className="text-md font-medium text-indigo-200 mb-3 flex items-center">
                  <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  Next 2-4 Weeks
                </h3>
                <ul className="space-y-3">
                  {assessment.action_plan.short_term.map((action, index) => (
                    <li key={index} className="flex items-start bg-indigo-900/20 p-3 rounded-md">
                      <span className="text-indigo-300 mr-2 font-bold">{index + 1}.</span>
                      <span className="text-slate-300">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Long-term Actions */}
              <div>
                <h3 className="text-md font-medium text-indigo-200 mb-3 flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Beyond 1 Month
                </h3>
                <ul className="space-y-3">
                  {assessment.action_plan.long_term.map((action, index) => (
                    <li key={index} className="flex items-start bg-indigo-900/20 p-3 rounded-md">
                      <span className="text-indigo-300 mr-2 font-bold">{index + 1}.</span>
                      <span className="text-slate-300">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8"
      >
        <Card className="border border-pink-500/20 bg-pink-900/5 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-pink-300 flex items-center">
              <LightbulbIcon className="mr-2 h-5 w-5" />
              Personal Insights
            </CardTitle>
            <CardDescription className="text-slate-400">
              Unique observations about your fitness journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessment.personal_insights.map((insight, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-pink-900/10 to-purple-900/10 rounded-lg border border-pink-500/10">
                  <p className="text-slate-300 italic">"{insight}"</p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-4">
            <Button
              onClick={viewFitnessPlan}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              View Your Complete Fitness Plan
              <ArrowForwardIcon className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
} 