'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeComponent } from '@/components/ui/safe-component';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Dumbbell, Heart, Award, Clock, Download } from 'lucide-react';
import { generatePDF } from '@/utils/pdfUtils';
import { toast } from '@/components/ui/use-toast';

// Dynamically import components to avoid hydration issues
const Navbar = dynamic(
  () => import('@/components/landing/navbar').then(mod => mod.Navbar),
  { ssr: false }
);

const Footer = dynamic(
  () => import('@/components/landing/footer').then(mod => mod.Footer),
  { ssr: false }
);

const BackgroundAnimation = dynamic(
  () => import('@/components/landing/background-animation').then(mod => mod.default),
  { ssr: false }
);

export default function FitnessProgressPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<any>(null);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get form data from local storage
    const storedData = localStorage.getItem('fitnessFormData');
    const storedPlan = localStorage.getItem('fitnessGeneratedPlan');
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setFormData(parsedData);
        
        if (storedPlan) {
          // We have a generated plan from the API
          const parsedPlan = JSON.parse(storedPlan);
          setGeneratedPlan(parsedPlan);
          setPlanGenerated(true);
          
          // Add a small delay to show loading animation
          const timer = setTimeout(() => {
            setLoading(false);
          }, 1500);
          
          return () => clearTimeout(timer);
        } else {
          // No plan generated yet
          // Fallback to the hardcoded logic behavior with simulation
          const timer = setTimeout(() => {
            setPlanGenerated(true);
            setLoading(false);
          }, 2000);
          
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error("Error parsing data:", error);
        setLoading(false);
      }
    } else {
      // If no form data, redirect back to the form
      router.push('/fitness/form');
    }
  }, [router]);

  // Generate a personalized workout routine based on form data
  const generateWorkoutPlan = () => {
    if (!formData) return null;
    
    let workouts = [];
    const primaryGoal = formData.primaryGoal;
    const daysPerWeek = formData.workoutDaysPerWeek;
    const experienceLevel = formData.experienceLevel;
    
    // Simplified logic for demo purposes
    if (primaryGoal === 'weight-loss') {
      workouts = [
        {
          day: 'Day 1',
          focus: 'Cardio + Full Body',
          exercises: [
            '30 min moderate-intensity cardio',
            '3 sets of bodyweight squats',
            '3 sets of push-ups',
            '3 sets of dumbbell rows',
            '3 sets of planks'
          ]
        },
        {
          day: 'Day 2',
          focus: 'HIIT + Core',
          exercises: [
            '20 min HIIT session',
            '3 sets of mountain climbers',
            '3 sets of bicycle crunches',
            '3 sets of Russian twists',
            '2 sets of burpees'
          ]
        },
        {
          day: 'Day 3',
          focus: 'Strength + Cardio',
          exercises: [
            '20 min low-intensity steady state cardio',
            '3 sets of lunges',
            '3 sets of shoulder press',
            '3 sets of deadlifts',
            '3 sets of glute bridges'
          ]
        }
      ];
    } else if (primaryGoal === 'muscle-gain') {
      workouts = [
        {
          day: 'Day 1',
          focus: 'Upper Body',
          exercises: [
            '4 sets of bench press',
            '4 sets of rows',
            '3 sets of shoulder press',
            '3 sets of bicep curls',
            '3 sets of tricep extensions'
          ]
        },
        {
          day: 'Day 2',
          focus: 'Lower Body',
          exercises: [
            '4 sets of squats',
            '4 sets of deadlifts',
            '3 sets of leg press',
            '3 sets of leg curls',
            '4 sets of calf raises'
          ]
        },
        {
          day: 'Day 3',
          focus: 'Full Body',
          exercises: [
            '3 sets of pull-ups',
            '3 sets of dips',
            '3 sets of lunges',
            '3 sets of lateral raises',
            '3 sets of planks'
          ]
        }
      ];
    } else {
      // Default balanced workout
      workouts = [
        {
          day: 'Day 1',
          focus: 'Full Body Strength',
          exercises: [
            '3 sets of squats',
            '3 sets of push-ups',
            '3 sets of rows',
            '3 sets of planks',
            '20 min light cardio'
          ]
        },
        {
          day: 'Day 2',
          focus: 'Cardio & Core',
          exercises: [
            '30 min moderate cardio',
            '3 sets of crunches',
            '3 sets of mountain climbers',
            '3 sets of plank variations',
            '3 sets of Russian twists'
          ]
        },
        {
          day: 'Day 3',
          focus: 'Flexibility & Recovery',
          exercises: [
            '30 min yoga flow',
            '10 min stretching routine',
            'Foam rolling for major muscle groups',
            '5 min meditation',
            'Active rest day activities'
          ]
        }
      ];
    }
    
    return workouts;
  };

  // Generate nutrition recommendations
  const generateNutritionPlan = () => {
    if (!formData) return null;
    
    const primaryGoal = formData.primaryGoal;
    
    if (primaryGoal === 'weight-loss') {
      return {
        calorieFocus: 'Moderate calorie deficit (300-500 calories below maintenance)',
        macros: 'Higher protein (30-35%), moderate fat (25-30%), lower carbs (35-40%)',
        mealTiming: '3 main meals, 1-2 small snacks, emphasis on protein with each meal',
        hydration: 'Minimum 3 liters of water daily',
        recommendations: [
          'Focus on whole foods and avoid processed items',
          'Prioritize protein and vegetables at each meal',
          'Consider intermittent fasting if it fits your schedule',
          'Plan meals ahead to avoid impulsive choices'
        ]
      };
    } else if (primaryGoal === 'muscle-gain') {
      return {
        calorieFocus: 'Moderate calorie surplus (300-500 calories above maintenance)',
        macros: 'High protein (30-35%), moderate carbs (45-50%), moderate fat (20-25%)',
        mealTiming: '4-6 smaller meals throughout the day, emphasis on post-workout nutrition',
        hydration: 'Minimum 3-4 liters of water daily',
        recommendations: [
          'Prioritize protein intake (1.6-2.2g per kg of bodyweight)',
          'Focus on complex carbs around workouts',
          'Include healthy fats for hormone production',
          'Consider a protein shake post-workout for recovery'
        ]
      };
    } else {
      return {
        calorieFocus: 'Maintenance calories (balanced energy intake)',
        macros: 'Balanced macros (25-30% protein, 40-45% carbs, 25-30% fat)',
        mealTiming: '3 main meals with balanced composition, 1-2 optional snacks',
        hydration: 'Minimum 2.5-3 liters of water daily',
        recommendations: [
          'Focus on whole, nutrient-dense foods',
          'Include a variety of fruits and vegetables daily',
          'Balance protein, healthy fats and complex carbs at meals',
          'Practice mindful eating and listen to hunger cues'
        ]
      };
    }
  };

  // Use the LLM-generated plan if available, otherwise fall back to the hardcoded plans
  const getWorkoutPlan = () => {
    if (generatedPlan && generatedPlan.plan && generatedPlan.plan.workoutPlan && generatedPlan.plan.workoutPlan.length > 0) {
      return generatedPlan.plan.workoutPlan;
    }
    return generateWorkoutPlan(); // Fallback to the hardcoded plan
  };

  // Use the LLM-generated nutrition plan if available, otherwise fall back to the hardcoded plan
  const getNutritionPlan = () => {
    if (generatedPlan && generatedPlan.plan && generatedPlan.plan.nutritionPlan) {
      return generatedPlan.plan.nutritionPlan;
    }
    return generateNutritionPlan(); // Fallback to the hardcoded plan
  };

  // Get progression tips if available from LLM
  const getProgressionTips = () => {
    if (generatedPlan && generatedPlan.plan && generatedPlan.plan.tips && generatedPlan.plan.tips.length > 0) {
      return generatedPlan.plan.tips;
    }
    return [
      'Start small and gradually increase intensity',
      'Track your progress weekly',
      'Adjust your plan as you improve',
      'Stay consistent and patient with your results'
    ];
  };

  const workoutPlan = getWorkoutPlan();
  const nutritionPlan = getNutritionPlan();
  const progressionTips = getProgressionTips();

  // Function to handle PDF export
  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    
    try {
      setIsExporting(true);
      
      // Add a notification that PDF export is in progress
      toast({
        title: "Preparing PDF",
        description: "Please wait while we generate your fitness plan PDF...",
        duration: 3000,
      });
      
      // Generate the PDF from the content div
      const name = formData?.name || 'User';
      const fileName = `Thrive_AI_Fitness_Plan_${new Date().toISOString().split('T')[0]}.pdf`;
      
      console.log("Starting PDF export process...");
      
      // Add additional styles to make the PDF look better
      const contentDiv = contentRef.current;
      const originalStyles = {
        background: contentDiv.style.background,
        padding: contentDiv.style.padding,
        borderRadius: contentDiv.style.borderRadius,
      };
      
      // Apply PDF-specific styles
      contentDiv.style.background = "#ffffff";
      contentDiv.style.padding = "20px";
      contentDiv.style.borderRadius = "0";
      
      const result = await generatePDF(contentRef.current, fileName);
      
      // Restore original styles
      contentDiv.style.background = originalStyles.background;
      contentDiv.style.padding = originalStyles.padding;
      contentDiv.style.borderRadius = originalStyles.borderRadius;
      
      if (result) {
        toast({
          title: "PDF Generated",
          description: "Your fitness plan has been downloaded as a PDF",
          variant: "success",
          duration: 3000,
        });
      } else {
        toast({
          title: "PDF Generation Failed",
          description: "Try again or contact support if the issue persists",
          variant: "destructive",
          duration: 3000,
        });
      }
      
      setIsExporting(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      
      toast({
        title: "Error",
        description: "Failed to export your fitness plan as PDF",
        variant: "destructive",
        duration: 3000,
      });
      
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Background */}
        <div className="fixed inset-0 z-0">
          <div className="bg-background/80 h-full" />
        </div>
        
        <SafeComponent fallback={<div className="h-16" />}>
          <Navbar />
        </SafeComponent>
        
        <main className="flex-1 z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-6 text-xl">Analyzing your data and generating your personalized fitness plan...</p>
          </div>
        </main>
        
        <SafeComponent fallback={<div className="h-16" />}>
          <Footer />
        </SafeComponent>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <SafeComponent fallback={<div className="bg-background/80" />}>
          <BackgroundAnimation reducedIntensity={true} />
        </SafeComponent>
      </div>
      
      {/* Navbar */}
      <SafeComponent fallback={<div className="h-16" />}>
        <Navbar />
      </SafeComponent>
      
      {/* Main Content */}
      <main className="flex-1 z-10 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-5xl mx-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/fitness/form')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Form
            </Button>
            
            <Button
              onClick={handleExportPDF}
              disabled={isExporting || loading}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export as PDF'}
            </Button>
          </div>
          
          <Card className="border border-violet-500/20 shadow-lg shadow-violet-500/5 bg-background/80 backdrop-blur-md mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl md:text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-600">
                Your Personalized Fitness Plan
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Based on your profile and goals, we've created the following recommendations
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {formData && (
                <div className="space-y-8" ref={contentRef}>
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-background/50 border border-violet-500/10">
                      <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="bg-violet-500/10 p-3 rounded-full mb-3">
                          <Dumbbell className="h-6 w-6 text-violet-500" />
                        </div>
                        <h3 className="font-semibold mb-1">Primary Goal</h3>
                        <p className="text-sm text-muted-foreground">
                          {formData.primaryGoal === 'weight-loss' ? 'Weight Loss' :
                           formData.primaryGoal === 'muscle-gain' ? 'Muscle Gain' : 
                           formData.primaryGoal === 'endurance' ? 'Improve Endurance' :
                           formData.primaryGoal === 'strength' ? 'Increase Strength' :
                           formData.primaryGoal === 'flexibility' ? 'Improve Flexibility' : 
                           'Overall Fitness'}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-background/50 border border-violet-500/10">
                      <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="bg-violet-500/10 p-3 rounded-full mb-3">
                          <Calendar className="h-6 w-6 text-violet-500" />
                        </div>
                        <h3 className="font-semibold mb-1">Workout Frequency</h3>
                        <p className="text-sm text-muted-foreground">
                          {formData.workoutDaysPerWeek === '1-2' ? '1-2 days/week' :
                           formData.workoutDaysPerWeek === '3-4' ? '3-4 days/week' :
                           formData.workoutDaysPerWeek === '5-6' ? '5-6 days/week' : 
                           'Every day'}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-background/50 border border-violet-500/10">
                      <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="bg-violet-500/10 p-3 rounded-full mb-3">
                          <Clock className="h-6 w-6 text-violet-500" />
                        </div>
                        <h3 className="font-semibold mb-1">Workout Duration</h3>
                        <p className="text-sm text-muted-foreground">
                          {formData.workoutDuration === '15-30' ? '15-30 minutes' :
                           formData.workoutDuration === '30-45' ? '30-45 minutes' :
                           formData.workoutDuration === '45-60' ? '45-60 minutes' : 
                           '60+ minutes'}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-background/50 border border-violet-500/10">
                      <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="bg-violet-500/10 p-3 rounded-full mb-3">
                          <Award className="h-6 w-6 text-violet-500" />
                        </div>
                        <h3 className="font-semibold mb-1">Experience Level</h3>
                        <p className="text-sm text-muted-foreground">
                          {formData.experienceLevel === 'beginner' ? 'Beginner' :
                           formData.experienceLevel === 'intermediate' ? 'Intermediate' :
                           formData.experienceLevel === 'advanced' ? 'Advanced' : 
                           'Athlete'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Workout Plan */}
                  <Card className="border border-violet-500/10">
                    <CardHeader>
                      <CardTitle className="text-xl md:text-2xl">Recommended Workout Plan</CardTitle>
                      <CardDescription>
                        Based on your goals, preferences and schedule
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {workoutPlan && workoutPlan.map((workout: any, index: number) => (
                          <Card key={index} className="bg-background/50 border border-violet-500/10">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg font-semibold">{workout.day}</CardTitle>
                              <CardDescription>{workout.focus}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                {workout.exercises.map((exercise: string, i: number) => (
                                  <li key={i}>{exercise}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Nutrition Plan */}
                  <Card className="border border-violet-500/10">
                    <CardHeader>
                      <CardTitle className="text-xl md:text-2xl">Nutrition Recommendations</CardTitle>
                      <CardDescription>
                        Aligned with your fitness goals
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {nutritionPlan && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-medium text-violet-500 mb-2">Calorie Focus</h3>
                              <p className="text-sm">{nutritionPlan.calorieFocus}</p>
                            </div>
                            <div>
                              <h3 className="font-medium text-violet-500 mb-2">Macro Distribution</h3>
                              <p className="text-sm">{nutritionPlan.macros}</p>
                            </div>
                            <div>
                              <h3 className="font-medium text-violet-500 mb-2">Meal Timing</h3>
                              <p className="text-sm">{nutritionPlan.mealTiming}</p>
                            </div>
                            <div>
                              <h3 className="font-medium text-violet-500 mb-2">Hydration</h3>
                              <p className="text-sm">{nutritionPlan.hydration}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-violet-500 mb-2">Key Recommendations</h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                              {nutritionPlan.recommendations.map((rec: string, i: number) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Progression Tips */}
                  <Card className="border border-violet-500/10">
                    <CardHeader>
                      <CardTitle className="text-xl md:text-2xl">Progression Tips</CardTitle>
                      <CardDescription>
                        Tips to help you achieve your fitness goals
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {progressionTips.map((tip: string, i: number) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  {/* Next Steps */}
                  <Card className="border border-violet-500/20 bg-violet-950/5">
                    <CardHeader>
                      <CardTitle className="text-xl md:text-2xl">Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-4">
                        <li className="flex items-start">
                          <div className="bg-violet-500/10 p-2 rounded-full mr-3 mt-0.5">
                            <span className="text-violet-500 font-bold text-sm">1</span>
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">Save Your Plan</h3>
                            <p className="text-sm text-muted-foreground">
                              Bookmark this page or take screenshots of your plan for easy reference.
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-violet-500/10 p-2 rounded-full mr-3 mt-0.5">
                            <span className="text-violet-500 font-bold text-sm">2</span>
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">Start Small</h3>
                            <p className="text-sm text-muted-foreground">
                              Begin with just 1-2 workouts per week if you're new to fitness, and gradually increase.
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-violet-500/10 p-2 rounded-full mr-3 mt-0.5">
                            <span className="text-violet-500 font-bold text-sm">3</span>
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">Track Your Progress</h3>
                            <p className="text-sm text-muted-foreground">
                              Keep a fitness journal to monitor your workouts, nutrition, and how you feel.
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-violet-500/10 p-2 rounded-full mr-3 mt-0.5">
                            <span className="text-violet-500 font-bold text-sm">4</span>
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">Adjust As Needed</h3>
                            <p className="text-sm text-muted-foreground">
                              Update your plan as you progress and your fitness level improves.
                            </p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
      
      {/* Footer */}
      <SafeComponent fallback={<div className="h-16" />}>
        <Footer />
      </SafeComponent>
    </div>
  );
} 