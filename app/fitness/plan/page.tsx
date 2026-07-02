'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/firebaseConfig';
import { savePlanToUserProfile } from '@/lib/firebase/userService';
import {
  ChevronDown,
  ChevronUp,
  Check,
  CalendarDays,
  Dumbbell,
  Target,
  TriangleAlert,
  Save,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

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
  health_summary?: {
    overview: string;
    recommendations: string[];
    cautions: string[];
  };
}

export default function FitnessPlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeWorkout, setActiveWorkout] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false);
  const [savedToFirebase, setSavedToFirebase] = useState(false);
  const { toast } = useToast();

  // Add this function to ensure weekly routine data integrity
  const ensureValidWeeklyRoutine = (plan: any) => {
    if (!plan) return plan;

    // Validate and ensure health_summary exists with all required properties
    if (!plan.health_summary) {
      plan.health_summary = {
        overview: "Your personalized fitness plan based on your profile information.",
        recommendations: ["Follow this plan consistently for best results", "Adjust exercises as needed based on comfort level"],
        cautions: ["Stop any exercise if you experience pain", "Consult with a healthcare provider before starting"]
      };
    } else {
      // Ensure all properties exist
      if (!plan.health_summary.overview) {
        plan.health_summary.overview = "Your personalized fitness plan based on your profile information.";
      }

      // Handle recommendation/recommendations inconsistency
      if (!plan.health_summary.recommendations) {
        if (plan.health_summary.recommendation) {
          plan.health_summary.recommendations = plan.health_summary.recommendation;
        } else {
          plan.health_summary.recommendations = ["Follow this plan consistently for best results", "Adjust exercises as needed based on comfort level"];
        }
      }

      // Handle caution/cautions inconsistency
      if (!plan.health_summary.cautions) {
        if (plan.health_summary.caution) {
          plan.health_summary.cautions = plan.health_summary.caution;
        } else {
          plan.health_summary.cautions = ["Stop any exercise if you experience pain", "Consult with a healthcare provider before starting"];
        }
      }

      // Ensure arrays are actually arrays
      if (!Array.isArray(plan.health_summary.recommendations)) {
        plan.health_summary.recommendations = [plan.health_summary.recommendations].filter(Boolean);
      }
      if (!Array.isArray(plan.health_summary.cautions)) {
        plan.health_summary.cautions = [plan.health_summary.cautions].filter(Boolean);
      }
    }

    // Fix inconsistencies in diet structure
    if (!plan.diet) {
      plan.diet = {
        meals: [],
        recommendations: [],
        restrictions: []
      };
    } else {
      // Handle meal/meals inconsistency
      if (!plan.diet.meals) {
        if (plan.diet.meal && Array.isArray(plan.diet.meal)) {
          plan.diet.meals = plan.diet.meal.map((meal: any) => {
            // Ensure each meal has the required properties
            return {
              name: meal.name || "Untitled Meal",
              description: meal.description || meal.meal || "Balanced meal",
              time: meal.time || "Anytime"
            };
          });
        } else {
          plan.diet.meals = [];
        }
      }

      // Handle recommendation/recommendations inconsistency
      if (!plan.diet.recommendations) {
        if (plan.diet.recommendation && Array.isArray(plan.diet.recommendation)) {
          plan.diet.recommendations = plan.diet.recommendation;
        } else {
          plan.diet.recommendations = [];
        }
      }

      // Handle restriction/restrictions inconsistency
      if (!plan.diet.restrictions) {
        if (plan.diet.restriction && Array.isArray(plan.diet.restriction)) {
          plan.diet.restrictions = plan.diet.restriction;
        } else {
          plan.diet.restrictions = [];
        }
      }
    }

    // Fix inconsistencies in workouts structure
    if (!plan.workouts) {
      if (plan.workout && Array.isArray(plan.workout)) {
        plan.workouts = plan.workout.map((w: any) => {
          return {
            name: w.name || "Untitled Workout",
            description: w.description || "General workout",
            duration: w.duration || "30-60 mins",
            exercises: Array.isArray(w.exercise) ? w.exercise.map((ex: any) => {
              return {
                name: ex.name || "Exercise",
                sets: parseInt(ex.set) || ex.sets || 3,
                reps: ex.rep || ex.reps || "10-12",
                notes: ex.note || ex.notes
              };
            }) : []
          };
        });
      } else {
        plan.workouts = [];
      }
    }

    // Validate goals structure
    if (!plan.goals) {
      if (plan.goal) {
        plan.goals = {
          short_term: Array.isArray(plan.goal.short_term) ? plan.goal.short_term : [],
          long_term: Array.isArray(plan.goal.long_term) ? plan.goal.long_term : [],
          metrics: plan.goal.metric || plan.goal.metrics || {}
        };
      } else {
        plan.goals = {
          short_term: ["Establish consistent workout routine", "Master proper exercise form"],
          long_term: ["Improve overall strength and endurance", "Develop sustainable fitness habits"],
          metrics: {
            "weight": "Track weekly",
            "reps": "Increase gradually",
            "energy": "Monitor daily"
          }
        };
      }
    } else {
      // Ensure short_term property exists and is an array
      if (!plan.goals.short_term) {
        plan.goals.short_term = ["Establish consistent workout routine", "Master proper exercise form"];
      } else if (!Array.isArray(plan.goals.short_term)) {
        plan.goals.short_term = [plan.goals.short_term].filter(Boolean);
      }

      // Ensure long_term property exists and is an array
      if (!plan.goals.long_term) {
        plan.goals.long_term = ["Improve overall strength and endurance", "Develop sustainable fitness habits"];
      } else if (!Array.isArray(plan.goals.long_term)) {
        plan.goals.long_term = [plan.goals.long_term].filter(Boolean);
      }

      // Ensure metrics property exists
      if (!plan.goals.metrics) {
        plan.goals.metrics = {
          "weight": "Track weekly",
          "reps": "Increase gradually",
          "energy": "Monitor daily"
        };
      }
    }

    // Original weekly routine validation
    if (!plan.weekly_routine) return plan;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const defaultWorkout = {
      workouts: ["Rest day"],
      nutrition: "Balanced meals with adequate hydration",
      recovery: "Light stretching and proper rest"
    };

    // Make sure all days exist with proper workout arrays
    days.forEach(day => {
      // If day doesn't exist, create it
      if (!plan.weekly_routine[day]) {
        plan.weekly_routine[day] = { ...defaultWorkout };
      }
      // If workouts is not an array, convert it
      else if (!Array.isArray(plan.weekly_routine[day].workouts)) {
        // If workout exists instead of workouts
        if (Array.isArray(plan.weekly_routine[day].workout)) {
          plan.weekly_routine[day].workouts = plan.weekly_routine[day].workout;
        }
        // If it's a string, convert to array with that string
        else if (typeof plan.weekly_routine[day].workouts === 'string') {
          plan.weekly_routine[day].workouts = [plan.weekly_routine[day].workouts];
        }
        // Otherwise create default array
        else {
          plan.weekly_routine[day].workouts = ["Rest day"];
        }
      }
      // If array is empty, add default value
      else if (plan.weekly_routine[day].workouts.length === 0) {
        plan.weekly_routine[day].workouts = ["Rest day"];
      }
    });

    // Debug output
    console.log("Plan structure after validation:", JSON.stringify({
      hasHealthSummary: !!plan.health_summary,
      hasDiet: !!plan.diet,
      dietMealsLength: plan.diet?.meals?.length || 0,
      workoutsLength: plan.workouts?.length || 0,
      hasGoals: !!plan.goals,
      hasWeeklyRoutine: !!plan.weekly_routine
    }));

    return plan;
  };

  // Load plan from localStorage on component mount and save to Firebase if user is authenticated
  useEffect(() => {
    setLoading(true);
    try {
      const savedPlan = localStorage.getItem('fitnessPlan');
      if (savedPlan) {
        const parsedPlan = JSON.parse(savedPlan);
        // Fix any inconsistencies in the plan data
        const validatedPlan = ensureValidWeeklyRoutine(parsedPlan);
        setPlan(validatedPlan);

        // Check if the user is authenticated but don't auto-save to Firebase
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            // Set that user is authenticated but don't save automatically
            setSavedToFirebase(false);
          }
        });

        return () => unsubscribe();
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

  // Save plan to Firebase
  const saveToFirebase = async (planData: FitnessPlan, userId: string) => {
    if (!planData) return;

    setIsSavingToFirebase(true);

    try {
      // Create a summary for Firebase
      const planSummary = {
        id: `fitness-plan-${Date.now()}`,
        type: 'fitness',
        title: 'Fitness Plan',
        description: `Personalized plan with ${planData.workouts?.length || 0} workouts and ${planData.diet?.meals?.length || 0} meal recommendations`,
        path: '/fitness/plan',
        createdAt: new Date().toISOString()
      };

      // Save to Firebase
      await savePlanToUserProfile(userId, planSummary);

      // Show success message
      toast({
        title: "Plan saved to your profile",
        description: "You can access this plan anytime from your profile page",
      });

      return true;
    } catch (error) {
      console.error("Error saving to Firebase:", error);
      return false;
    } finally {
      setIsSavingToFirebase(false);
    }
  };

  // Manual save to Firebase button handler
  const handleSaveToProfile = async () => {
    if (!plan) return;

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save this plan to your profile",
        variant: "destructive"
      });
      return;
    }

    setIsSavingToFirebase(true);

    try {
      const success = await saveToFirebase(plan, user.uid);

      if (success) {
        setSavedToFirebase(true);
        toast({
          title: "Success!",
          description: "Your fitness plan has been saved to your profile",
        });
      } else {
        throw new Error("Failed to save plan");
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({
        title: "Failed to save",
        description: "There was a problem saving your plan. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSavingToFirebase(false);
    }
  };

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

  // This optimizes the rendering of workout lists
  const renderWorkoutsList = useCallback(() => {
    if (!plan?.workouts || !Array.isArray(plan.workouts) || plan.workouts.length === 0) {
      return (
        <div className="p-4 text-center">
          <p className="text-text-muted">No workout data available.</p>
        </div>
      );
    }

    return plan.workouts.map((workout, index) => (
      <div
        key={`workout-${index}`}
        className="mb-4 rounded-md border border-border bg-surface-sunken p-4"
      >
        <div
          className="flex cursor-pointer items-center justify-between"
          onClick={() => toggleWorkout(index)}
        >
          <div>
            <h3 className="text-lg font-semibold text-foreground">{workout.name || "Untitled Workout"}</h3>
            <p className="text-sm text-text-body">{workout.description || "No description available"}</p>
            <div className="mt-1 font-mono text-xs uppercase tracking-wide text-text-muted">
              Duration: {workout.duration || "Unknown"}
            </div>
          </div>
          <div className="text-text-muted">
            {activeWorkout === index ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
          </div>
        </div>

        {activeWorkout === index && (
          <div className="mt-4 border-t border-border pt-4">
            <h4 className="mb-2 text-sm font-medium text-foreground">Exercises</h4>
            <div className="space-y-3">
              {workout.exercises && Array.isArray(workout.exercises) && workout.exercises.length > 0 ? (
                workout.exercises.map((exercise, exIndex) => (
                  <div key={`ex-${index}-${exIndex}`} className="rounded-md border border-border bg-surface p-3">
                    <h5 className="font-medium text-foreground">{exercise.name || "Untitled Exercise"}</h5>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                      <div className="text-text-body">Sets: {exercise.sets || "N/A"}</div>
                      <div className="text-text-body">Reps: {exercise.reps || "N/A"}</div>
                    </div>
                    {exercise.notes && (
                      <div className="mt-2 text-sm text-text-muted">
                        <span className="font-medium">Notes:</span> {exercise.notes}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-muted">No exercises found for this workout.</p>
              )}
            </div>
          </div>
        )}
      </div>
    ));
  }, [plan?.workouts, activeWorkout, toggleWorkout]);

  // When there's an error or loading
  if (error) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto max-w-app text-center">
          <h1 className="mb-6 font-serif text-2xl font-semibold text-foreground md:text-3xl">
            {error}
          </h1>
          <Button onClick={() => router.push('/fitness/form')} variant="primary">
            Go to fitness form
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
          <p className="text-text-muted">Loading your fitness plan…</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const tabTriggerClass =
    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs";

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-app" ref={contentRef}>
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-accent">
            Your plan
          </span>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.015em] text-foreground md:text-4xl">
            Your personalized fitness plan
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-text-muted">
            Based on your profile, we&apos;ve built a plan to help you reach your fitness goals.
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8 grid grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="overview" className={tabTriggerClass}>Overview</TabsTrigger>
            <TabsTrigger value="workouts" className={tabTriggerClass}>Workouts</TabsTrigger>
            <TabsTrigger value="nutrition" className={tabTriggerClass}>Nutrition</TabsTrigger>
            <TabsTrigger value="schedule" className={tabTriggerClass}>Schedule</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Health Summary Card */}
              {plan.health_summary && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Target className="size-5 text-primary" />
                      <CardTitle>Your health profile</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {plan.health_summary.overview && (
                      <p className="mb-4 text-text-body">{plan.health_summary.overview}</p>
                    )}

                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                      {plan.health_summary.recommendations && plan.health_summary.recommendations.length > 0 && (
                        <div>
                          <h3 className="mb-2 font-medium text-foreground">Recommendations</h3>
                          <ul className="space-y-2">
                            {plan.health_summary.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start">
                                <Check className="mr-2 mt-0.5 size-4 flex-shrink-0 text-success" />
                                <span className="text-sm text-text-body">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {plan.health_summary.cautions && plan.health_summary.cautions.length > 0 && (
                        <div>
                          <h3 className="mb-2 font-medium text-foreground">Cautions</h3>
                          <ul className="space-y-2">
                            {plan.health_summary.cautions.map((caution, index) => (
                              <li key={index} className="flex items-start">
                                <TriangleAlert className="mr-2 mt-0.5 size-4 flex-shrink-0 text-warning" />
                                <span className="text-sm text-text-body">{caution}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Goals Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Dumbbell className="size-5 text-primary" />
                    <CardTitle>Your goals</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="mb-2 font-medium text-foreground">Short-term goals</h3>
                    <ul className="space-y-2">
                      {plan.goals?.short_term?.map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="mr-2 mt-0.5 size-4 flex-shrink-0 text-success" />
                          <span className="text-sm text-text-body">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 font-medium text-foreground">Long-term goals</h3>
                    <ul className="space-y-2">
                      {plan.goals?.long_term?.map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="mr-2 mt-0.5 size-4 flex-shrink-0 text-success" />
                          <span className="text-sm text-text-body">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Metrics Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="size-5 text-primary" />
                    <CardTitle>Tracking metrics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(plan.goals?.metrics || {}).map(([key, value], index) => (
                      <div key={index} className="rounded-md border border-border bg-surface-sunken p-3">
                        <h3 className="mb-1 font-medium capitalize text-foreground">{key.replace(/_/g, ' ')}</h3>
                        <p className="text-sm text-text-body">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations Card */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Check className="size-5 text-primary" />
                    <CardTitle>Recommendations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.diet.recommendations && plan.diet.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="mr-2 mt-0.5 size-4 flex-shrink-0 text-success" />
                        <span className="text-sm text-text-body">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workouts Tab */}
          <TabsContent value="workouts">
            <Card>
              <CardHeader>
                <CardTitle>Your workout plan</CardTitle>
                <CardDescription>
                  A series of workouts designed to help you reach your fitness goals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">{renderWorkoutsList()}</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            <Card>
              <CardHeader>
                <CardTitle>Nutrition plan</CardTitle>
                <CardDescription>Recommended meals and dietary guidelines.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Meals */}
                  <div>
                    <h3 className="mb-3 text-base font-semibold text-foreground">Recommended meals</h3>
                    <div className="space-y-3">
                      {plan.diet?.meals?.map((meal, index) => (
                        <div key={index} className="rounded-md border border-border bg-surface-sunken p-3">
                          <div className="mb-1 flex items-start justify-between gap-3">
                            <h4 className="font-medium text-foreground">{meal.name}</h4>
                            <Badge tone="primary">{meal.time}</Badge>
                          </div>
                          <p className="text-sm text-text-body">{meal.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Recommendations */}
                  <div>
                    <h3 className="mb-3 text-base font-semibold text-foreground">Dietary recommendations</h3>
                    <ul className="space-y-2">
                      {plan.diet?.recommendations?.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="mr-2 mt-0.5 size-4 flex-shrink-0 text-success" />
                          <span className="text-sm text-text-body">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Restrictions */}
                  {plan.diet?.restrictions && plan.diet.restrictions.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-base font-semibold text-foreground">Dietary restrictions</h3>
                      <ul className="space-y-2">
                        {plan.diet.restrictions.map((restriction, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="mr-2 mt-0.5 size-4 flex-shrink-0 text-success" />
                            <span className="text-sm text-text-body">{restriction}</span>
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
            <Card>
              <CardHeader>
                <CardTitle>Weekly schedule</CardTitle>
                <CardDescription>Your day-by-day fitness and nutrition plan.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(plan.weekly_routine || {}).map(([day, routine], index) => (
                    <div key={index} className="overflow-hidden rounded-md border border-border">
                      <div className="flex items-center gap-3 bg-surface-sunken p-3">
                        <CalendarDays className="size-5 text-primary" />
                        <h3 className="font-medium capitalize text-foreground">{day}</h3>
                      </div>
                      <div className="space-y-4 p-4">
                        {/* Workouts */}
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-foreground">Workouts</h4>
                          {routine && routine.workouts && Array.isArray(routine.workouts) && routine.workouts.length > 0 ? (
                            <ul className="space-y-1">
                              {routine.workouts.map((workout, wIndex) => (
                                <li key={wIndex} className="flex items-start text-sm text-text-body">
                                  <Check className="mr-2 mt-0.5 size-4 flex-shrink-0 text-success" />
                                  {workout}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-text-muted">Rest day — no workouts scheduled.</p>
                          )}
                        </div>

                        {/* Nutrition */}
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-foreground">Nutrition</h4>
                          <p className="text-sm text-text-body">{routine?.nutrition || "Balanced nutrition recommended"}</p>
                        </div>

                        {/* Recovery */}
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-foreground">Recovery</h4>
                          <p className="text-sm text-text-body">{routine?.recovery || "Adequate rest and hydration"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => router.push('/fitness/form')} variant="outline">
            Back to fitness form
          </Button>

          <Button onClick={downloadAsPDF} variant="secondary" disabled={isGeneratingPDF}>
            {isGeneratingPDF ? 'Generating…' : 'Download PDF'}
          </Button>

          <Button
            onClick={handleSaveToProfile}
            variant="primary"
            disabled={isSavingToFirebase || savedToFirebase}
          >
            {isSavingToFirebase ? (
              'Saving…'
            ) : savedToFirebase ? (
              'Saved to profile'
            ) : (
              <>
                <Save className="size-4" /> Save to profile
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
