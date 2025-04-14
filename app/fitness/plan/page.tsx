'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckIcon from '@mui/icons-material/Check';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

// Load heavy libraries dynamically
const jsPDF = dynamic(() => import('jspdf').then(mod => mod.default), {
  ssr: false,
  loading: () => null,
});

const html2canvas = dynamic(() => import('html2canvas').then(mod => mod.default), {
  ssr: false,
  loading: () => null,
});

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  notes?: string;
}

interface Workout {
  name: string;
  description: string;
  duration: string;
  exercises: Exercise[];
}

interface Meal {
  name: string;
  description: string;
  time: string;
}

interface DayRoutine {
  workouts: string[];
  nutrition: string;
  recovery: string;
}

interface FitnessPlan {
  diet: {
    meals: Meal[];
    recommendations: string[];
    restrictions: string[];
  };
  workouts: Workout[];
  goals: {
    short_term: string[];
    long_term: string[];
    metrics: {
      [key: string]: string;
    };
  };
  weekly_routine: {
    [day: string]: DayRoutine;
  };
  recommendations?: string[];
}

export default function FitnessPlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeWorkout, setActiveWorkout] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Load plan from localStorage on component mount
  useEffect(() => {
    setLoading(true);
    try {
      const savedPlan = localStorage.getItem('fitnessPlan');
      if (savedPlan) {
        setPlan(JSON.parse(savedPlan));
      } else {
        setError('No fitness plan found. Please complete the fitness form first.');
      }
    } catch (e) {
      console.error('Error loading fitness plan:', e);
      setError('Error loading your fitness plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleWorkout = (index: number) => {
    if (activeWorkout === index) {
      setActiveWorkout(null);
    } else {
      setActiveWorkout(index);
    }
  };

  const downloadAsPDF = async () => {
    if (!contentRef.current) return;
    
    try {
      setIsGeneratingPDF(true);
      const element = contentRef.current;
      
      // Scroll to top to ensure everything is visible
      window.scrollTo(0, 0);
      
      // Dynamically load required libraries only when needed
      const Html2Canvas = await import('html2canvas').then(mod => mod.default);
      const JsPDF = await import('jspdf').then(mod => mod.default);
      
      // Create a new jsPDF instance
      const pdf = new JsPDF('p', 'mm', 'a4');
      
      // Convert HTML to canvas with optimized settings
      const canvas = await Html2Canvas(element, {
        scale: 1.5, // Reduced scale for better performance
        useCORS: true,
        logging: false,
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          // Simplify cloned document to improve rendering performance
          const animations = clonedDoc.querySelectorAll('.animate-pulse, .animate-spin');
          animations.forEach(el => {
            el.classList.remove('animate-pulse', 'animate-spin');
          });
          return clonedDoc;
        }
      });
      
      // Get canvas dimensions
      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Use JPEG with high quality
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      pdf.save('FitnessPlan.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Add this function to the component
  // This optimizes the rendering of workout lists
  const renderWorkoutsList = useCallback(() => {
    if (!plan?.workouts) return null;
    
    return plan.workouts.map((workout, index) => (
      <div 
        key={`workout-${index}`} 
        className="border border-violet-500/30 rounded-lg p-4 mb-4 bg-violet-950/20"
      >
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => toggleWorkout(index)}
        >
          <div>
            <h3 className="text-lg font-semibold text-violet-300">{workout.name}</h3>
            <p className="text-sm text-violet-300/70">{workout.description}</p>
            <div className="text-xs text-violet-400/60 mt-1">Duration: {workout.duration}</div>
          </div>
          <div className="text-violet-400">
            {activeWorkout === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </div>
        </div>
        
        {activeWorkout === index && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 border-t border-violet-500/20 pt-4"
          >
            <h4 className="text-sm font-medium text-violet-200 mb-2">Exercises:</h4>
            <div className="space-y-3">
              {workout.exercises.map((exercise, exIndex) => (
                <div key={`ex-${index}-${exIndex}`} className="bg-violet-900/20 p-3 rounded-md">
                  <h5 className="font-medium text-violet-100">{exercise.name}</h5>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                    <div className="text-violet-300/80">Sets: {exercise.sets}</div>
                    <div className="text-violet-300/80">Reps: {exercise.reps}</div>
                  </div>
                  {exercise.notes && (
                    <div className="mt-2 text-sm text-violet-300/70">
                      <span className="font-medium">Notes:</span> {exercise.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    ));
  }, [plan?.workouts, activeWorkout, toggleWorkout]);

  // When there's an error or loading
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-violet-300 mb-6">
            {error}
          </h1>
          <Button 
            onClick={() => router.push('/fitness/form')}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            Go to Fitness Form
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-violet-300">Loading your fitness plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-background to-background/80 py-12 px-4"
    >
      <div className="max-w-4xl mx-auto" ref={contentRef}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-600">
            Your Personalized Fitness Plan
          </h1>
          <p className="text-violet-300/80 mt-2 max-w-2xl mx-auto">
            Based on your profile, we've created a customized plan to help you achieve your fitness goals.
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="workouts" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              Workouts
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              Nutrition
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              Schedule
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Goals Card */}
              <Card className="border border-violet-500/20 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FitnessCenterIcon className="text-violet-500" sx={{ fontSize: 20 }} />
                    <CardTitle className="text-xl text-violet-300">Your Goals</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="text-violet-400 font-medium mb-2">Short-term Goals</h3>
                    <ul className="space-y-2">
                      {plan.goals.short_term.map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <CheckIcon className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-violet-400 font-medium mb-2">Long-term Goals</h3>
                    <ul className="space-y-2">
                      {plan.goals.long_term.map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <CheckIcon className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Metrics Card */}
              <Card className="border border-violet-500/20 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FitnessCenterIcon className="text-violet-500" sx={{ fontSize: 20 }} />
                    <CardTitle className="text-xl text-violet-300">Tracking Metrics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(plan.goals.metrics).map(([key, value], index) => (
                      <div key={index} className="p-3 rounded-lg bg-violet-900/20 border border-violet-800/30">
                        <h3 className="text-violet-400 font-medium mb-1 capitalize">{key.replace(/_/g, ' ')}</h3>
                        <p className="text-sm text-slate-300">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations Card */}
              <Card className="border border-violet-500/20 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden md:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <ErrorOutlineIcon className="text-violet-500" sx={{ fontSize: 20 }} />
                    <CardTitle className="text-xl text-violet-300">Recommendations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.diet.recommendations && plan.diet.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-sm text-slate-300">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workouts Tab */}
          <TabsContent value="workouts">
            <Card className="border border-violet-500/20 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl text-violet-300">Your Workout Plan</CardTitle>
                <CardDescription>
                  A series of workouts designed to help you reach your fitness goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {renderWorkoutsList()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            <Card className="border border-violet-500/20 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl text-violet-300">Nutrition Plan</CardTitle>
                <CardDescription>
                  Recommended meals and dietary guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Meals */}
                  <div>
                    <h3 className="text-lg text-violet-400 mb-3">Recommended Meals</h3>
                    <div className="space-y-3">
                      {plan.diet.meals.map((meal, index) => (
                        <div key={index} className="p-3 rounded-lg bg-violet-900/20 border border-violet-800/30">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-violet-300">{meal.name}</h4>
                            <span className="text-xs px-2 py-1 rounded bg-violet-800/50 text-violet-300">{meal.time}</span>
                          </div>
                          <p className="text-sm text-slate-300">{meal.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Recommendations */}
                  <div>
                    <h3 className="text-lg text-violet-400 mb-3">Dietary Recommendations</h3>
                    <ul className="space-y-2">
                      {plan.diet.recommendations && plan.diet.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <CheckIcon className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Restrictions */}
                  {plan.diet.restrictions && plan.diet.restrictions.length > 0 && (
                    <div>
                      <h3 className="text-lg text-violet-400 mb-3">Dietary Restrictions</h3>
                      <ul className="space-y-2">
                        {plan.diet.restrictions.map((restriction, index) => (
                          <li key={index} className="flex items-start">
                            <CheckIcon className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                            <span className="text-sm text-slate-300">{restriction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="border border-violet-500/20 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl text-violet-300">Weekly Schedule</CardTitle>
                <CardDescription>
                  Your day-by-day fitness and nutrition plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(plan.weekly_routine).map(([day, routine], index) => (
                    <div key={index} className="border border-violet-800/30 rounded-lg overflow-hidden">
                      <div className="p-3 bg-violet-900/20 flex items-center gap-3">
                        <CalendarTodayIcon className="text-violet-500" sx={{ fontSize: 20 }} />
                        <h3 className="font-medium text-violet-300 capitalize">{day}</h3>
                      </div>
                      <div className="p-4 space-y-4">
                        {/* Workouts */}
                        <div>
                          <h4 className="text-sm font-medium text-violet-400 mb-2">Workouts</h4>
                          {routine.workouts.length > 0 ? (
                            <ul className="space-y-1">
                              {routine.workouts.map((workout, wIndex) => (
                                <li key={wIndex} className="text-sm text-slate-300 flex items-start">
                                  <CheckIcon className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                                  {workout}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-400">Rest day - no workouts scheduled</p>
                          )}
                        </div>
                        
                        {/* Nutrition */}
                        <div>
                          <h4 className="text-sm font-medium text-violet-400 mb-2">Nutrition</h4>
                          <p className="text-sm text-slate-300">{routine.nutrition}</p>
                        </div>
                        
                        {/* Recovery */}
                        <div>
                          <h4 className="text-sm font-medium text-violet-400 mb-2">Recovery</h4>
                          <p className="text-sm text-slate-300">{routine.recovery}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Back to Form Button */}
        <div className="mt-8 text-center">
          <Button 
            onClick={() => router.push('/fitness/form')}
            variant="outline"
            className="border-violet-500/30 hover:bg-violet-500/10 hover:border-violet-500/50 mr-4"
          >
            Back to Fitness Form
          </Button>
          
          <Button 
            onClick={downloadAsPDF}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            Download PDF
          </Button>
        </div>
      </div>
    </motion.div>
  );
} 
 