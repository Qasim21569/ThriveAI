'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Dumbbell, Award, Clock, Download } from 'lucide-react';
import { generatePDF } from '@/utils/pdfUtils';
import { toast } from '@/components/ui/use-toast';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export default function FitnessProgressPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<any>(null);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedData = localStorage.getItem('fitnessFormData');
    const storedPlan = localStorage.getItem('fitnessGeneratedPlan');

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setFormData(parsedData);

        if (storedPlan) {
          const parsedPlan = JSON.parse(storedPlan);
          setGeneratedPlan(parsedPlan);
          setPlanGenerated(true);

          const timer = setTimeout(() => {
            setLoading(false);
          }, 1500);

          return () => clearTimeout(timer);
        } else {
          const timer = setTimeout(() => {
            setPlanGenerated(true);
            setLoading(false);
          }, 2000);

          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error('Error parsing data:', error);
        setLoading(false);
      }
    } else {
      router.push('/fitness/form');
    }
  }, [router]);

  // Generate a personalized workout routine based on form data
  const generateWorkoutPlan = () => {
    if (!formData) return null;

    let workouts = [];
    const primaryGoal = formData.primaryGoal;

    if (primaryGoal === 'weight-loss') {
      workouts = [
        { day: 'Day 1', focus: 'Cardio + Full Body', exercises: ['30 min moderate-intensity cardio', '3 sets of bodyweight squats', '3 sets of push-ups', '3 sets of dumbbell rows', '3 sets of planks'] },
        { day: 'Day 2', focus: 'HIIT + Core', exercises: ['20 min HIIT session', '3 sets of mountain climbers', '3 sets of bicycle crunches', '3 sets of Russian twists', '2 sets of burpees'] },
        { day: 'Day 3', focus: 'Strength + Cardio', exercises: ['20 min low-intensity steady state cardio', '3 sets of lunges', '3 sets of shoulder press', '3 sets of deadlifts', '3 sets of glute bridges'] },
      ];
    } else if (primaryGoal === 'muscle-gain') {
      workouts = [
        { day: 'Day 1', focus: 'Upper Body', exercises: ['4 sets of bench press', '4 sets of rows', '3 sets of shoulder press', '3 sets of bicep curls', '3 sets of tricep extensions'] },
        { day: 'Day 2', focus: 'Lower Body', exercises: ['4 sets of squats', '4 sets of deadlifts', '3 sets of leg press', '3 sets of leg curls', '4 sets of calf raises'] },
        { day: 'Day 3', focus: 'Full Body', exercises: ['3 sets of pull-ups', '3 sets of dips', '3 sets of lunges', '3 sets of lateral raises', '3 sets of planks'] },
      ];
    } else {
      workouts = [
        { day: 'Day 1', focus: 'Full Body Strength', exercises: ['3 sets of squats', '3 sets of push-ups', '3 sets of rows', '3 sets of planks', '20 min light cardio'] },
        { day: 'Day 2', focus: 'Cardio & Core', exercises: ['30 min moderate cardio', '3 sets of crunches', '3 sets of mountain climbers', '3 sets of plank variations', '3 sets of Russian twists'] },
        { day: 'Day 3', focus: 'Flexibility & Recovery', exercises: ['30 min yoga flow', '10 min stretching routine', 'Foam rolling for major muscle groups', '5 min meditation', 'Active rest day activities'] },
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
          'Plan meals ahead to avoid impulsive choices',
        ],
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
          'Consider a protein shake post-workout for recovery',
        ],
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
          'Practice mindful eating and listen to hunger cues',
        ],
      };
    }
  };

  const getWorkoutPlan = () => {
    if (generatedPlan && generatedPlan.plan && generatedPlan.plan.workoutPlan && generatedPlan.plan.workoutPlan.length > 0) {
      return generatedPlan.plan.workoutPlan;
    }
    return generateWorkoutPlan();
  };

  const getNutritionPlan = () => {
    if (generatedPlan && generatedPlan.plan && generatedPlan.plan.nutritionPlan) {
      return generatedPlan.plan.nutritionPlan;
    }
    return generateNutritionPlan();
  };

  const getProgressionTips = () => {
    if (generatedPlan && generatedPlan.plan && generatedPlan.plan.tips && generatedPlan.plan.tips.length > 0) {
      return generatedPlan.plan.tips;
    }
    return [
      'Start small and gradually increase intensity',
      'Track your progress weekly',
      'Adjust your plan as you improve',
      'Stay consistent and patient with your results',
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

      toast({
        title: 'Preparing PDF',
        description: 'Please wait while we generate your fitness plan PDF…',
        duration: 3000,
      });

      const fileName = `Thrive_AI_Fitness_Plan_${new Date().toISOString().split('T')[0]}.pdf`;

      const contentDiv = contentRef.current;
      const originalStyles = {
        background: contentDiv.style.background,
        padding: contentDiv.style.padding,
        borderRadius: contentDiv.style.borderRadius,
      };

      contentDiv.style.background = '#ffffff';
      contentDiv.style.padding = '20px';
      contentDiv.style.borderRadius = '0';

      const result = await generatePDF(contentRef.current, fileName);

      contentDiv.style.background = originalStyles.background;
      contentDiv.style.padding = originalStyles.padding;
      contentDiv.style.borderRadius = originalStyles.borderRadius;

      if (result) {
        toast({
          title: 'PDF generated',
          description: 'Your fitness plan has been downloaded as a PDF',
          duration: 3000,
        });
      } else {
        toast({
          title: 'PDF generation failed',
          description: 'Try again or contact support if the issue persists',
          variant: 'destructive',
          duration: 3000,
        });
      }

      setIsExporting(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to export your fitness plan as PDF',
        variant: 'destructive',
        duration: 3000,
      });
      setIsExporting(false);
    }
  };

  const summaryTiles: { Icon: typeof Dumbbell; label: string; value: string }[] = formData
    ? [
        {
          Icon: Dumbbell,
          label: 'Primary goal',
          value:
            formData.primaryGoal === 'weight-loss' ? 'Weight loss' :
            formData.primaryGoal === 'muscle-gain' ? 'Muscle gain' :
            formData.primaryGoal === 'endurance' ? 'Improve endurance' :
            formData.primaryGoal === 'strength' ? 'Increase strength' :
            formData.primaryGoal === 'flexibility' ? 'Improve flexibility' : 'Overall fitness',
        },
        {
          Icon: Calendar,
          label: 'Workout frequency',
          value:
            formData.workoutDaysPerWeek === '1-2' ? '1-2 days/week' :
            formData.workoutDaysPerWeek === '3-4' ? '3-4 days/week' :
            formData.workoutDaysPerWeek === '5-6' ? '5-6 days/week' : 'Every day',
        },
        {
          Icon: Clock,
          label: 'Workout duration',
          value:
            formData.workoutDuration === '15-30' ? '15-30 minutes' :
            formData.workoutDuration === '30-45' ? '30-45 minutes' :
            formData.workoutDuration === '45-60' ? '45-60 minutes' : '60+ minutes',
        },
        {
          Icon: Award,
          label: 'Experience level',
          value:
            formData.experienceLevel === 'beginner' ? 'Beginner' :
            formData.experienceLevel === 'intermediate' ? 'Intermediate' :
            formData.experienceLevel === 'advanced' ? 'Advanced' : 'Athlete',
        },
      ]
    : [];

  const nextSteps: { title: string; desc: string }[] = [
    { title: 'Save your plan', desc: 'Bookmark this page or export a PDF for easy reference.' },
    { title: 'Start small', desc: "Begin with 1-2 workouts per week if you're new to fitness, then build up." },
    { title: 'Track your progress', desc: 'Keep a fitness journal to monitor workouts, nutrition, and how you feel.' },
    { title: 'Adjust as needed', desc: 'Update your plan as you progress and your fitness level improves.' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto size-16 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
            <p className="mt-6 text-lg text-text-body">
              Analyzing your data and generating your personalized fitness plan…
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-content px-4 py-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Button variant="outline" onClick={() => router.push('/fitness/form')}>
              <ArrowLeft className="size-4" /> Back to form
            </Button>

            <Button onClick={handleExportPDF} variant="primary" disabled={isExporting || loading}>
              <Download className="size-4" />
              {isExporting ? 'Exporting…' : 'Export as PDF'}
            </Button>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center text-2xl md:text-3xl">
                Your personalized fitness plan
              </CardTitle>
              <CardDescription className="text-center">
                Based on your profile and goals, here are your recommendations.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {formData && (
                <div className="space-y-8" ref={contentRef}>
                  {/* Summary */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {summaryTiles.map((tile) => (
                      <div key={tile.label} className="flex flex-col items-center rounded-lg border border-border bg-surface-sunken p-5 text-center">
                        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary-soft">
                          <tile.Icon className="size-6 text-primary" />
                        </div>
                        <h3 className="mb-1 text-sm font-semibold text-foreground">{tile.label}</h3>
                        <p className="text-sm text-text-muted">{tile.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Workout Plan */}
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-foreground md:text-2xl">
                      Recommended workout plan
                    </h2>
                    <p className="mb-4 mt-1 text-sm text-text-muted">
                      Based on your goals, preferences, and schedule.
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {workoutPlan && workoutPlan.map((workout: any, index: number) => (
                        <div key={index} className="rounded-lg border border-border bg-surface-sunken p-4">
                          <h3 className="text-lg font-semibold text-foreground">{workout.day}</h3>
                          <p className="mb-3 text-sm text-text-muted">{workout.focus}</p>
                          <ul className="space-y-1.5 text-sm">
                            {workout.exercises.map((exercise: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-text-body">
                                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                                {exercise}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nutrition Plan */}
                  {nutritionPlan && (
                    <div>
                      <h2 className="font-serif text-xl font-semibold text-foreground md:text-2xl">
                        Nutrition recommendations
                      </h2>
                      <p className="mb-4 mt-1 text-sm text-text-muted">Aligned with your fitness goals.</p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {[
                          ['Calorie focus', nutritionPlan.calorieFocus],
                          ['Macro distribution', nutritionPlan.macros],
                          ['Meal timing', nutritionPlan.mealTiming],
                          ['Hydration', nutritionPlan.hydration],
                        ].map(([label, value]) => (
                          <div key={label as string} className="rounded-md border border-border bg-surface-sunken p-4">
                            <h3 className="mb-1 text-sm font-semibold text-foreground">{label}</h3>
                            <p className="text-sm text-text-body">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <h3 className="mb-2 text-sm font-semibold text-foreground">Key recommendations</h3>
                        <ul className="space-y-1.5 text-sm">
                          {nutritionPlan.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-text-body">
                              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Progression Tips */}
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-foreground md:text-2xl">
                      Progression tips
                    </h2>
                    <p className="mb-4 mt-1 text-sm text-text-muted">
                      Tips to help you achieve your fitness goals.
                    </p>
                    <ul className="space-y-1.5 text-sm">
                      {progressionTips.map((tip: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-text-body">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Next Steps */}
                  <div>
                    <h2 className="mb-4 font-serif text-xl font-semibold text-foreground md:text-2xl">Next steps</h2>
                    <ul className="space-y-4">
                      {nextSteps.map((step, i) => (
                        <li key={step.title} className="flex items-start gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-sm font-semibold text-coffee-700">
                            {i + 1}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                            <p className="text-sm text-text-muted">{step.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
