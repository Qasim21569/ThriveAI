// Groq API integration for the AI Life Coach app
import { fitnessPlanSchema } from '@/lib/validation/aiOutputs';

// Define coaching modes
export type CoachingMode = 'career' | 'fitness' | 'finance' | 'mental' | 'general';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// Field names must match exactly what FitnessForm.tsx sends
interface FitnessFormData {
  age: string;
  gender: string;
  height: string;
  weight: string;
  primaryGoal?: string;
  timeframe?: string;
  activityLevel?: string;
  experienceLevel?: string;
  workoutDaysPerWeek?: string;
  workoutDuration?: string;
  preferredExercises?: string;
  dislikedExercises?: string;
  dietPreference?: string;
  injuries?: string;
  healthConditions?: string;
  additionalInfo?: string;
}

// Define FitnessPlan type
interface FitnessPlan {
  health_summary?: {
    overview: string;
    recommendations: string[];
    cautions: string[];
  };
  diet: {
    meals: Array<{
      name: string;
      description: string;
      time: string;
    }>;
    recommendations: string[];
    restrictions: string[];
  };
  workouts: Array<{
    name: string;
    description: string;
    duration: string;
    exercises: Array<{
      name: string;
      sets: string;
      reps: string;
      notes: string;
    }>;
  }>;
  goals: {
    short_term: string[];
    long_term: string[];
    metrics: Record<string, string>;
  };
  weekly_routine: {
    monday: { workouts: string[]; nutrition: string; recovery?: string };
    tuesday: { workouts: string[]; nutrition: string; recovery?: string };
    wednesday: { workouts: string[]; nutrition: string; recovery?: string };
    thursday: { workouts: string[]; nutrition: string; recovery?: string };
    friday: { workouts: string[]; nutrition: string; recovery?: string };
    saturday: { workouts: string[]; nutrition: string; recovery?: string };
    sunday: { workouts: string[]; nutrition: string; recovery?: string };
  };
  recommendations?: string[];
}

/**
 * Generate a fitness plan using OpenRouter API
 */
export async function generateFitnessPlan(formData: FitnessFormData): Promise<FitnessPlan> {
  try {
    const prompt = createFitnessPlanPrompt(formData);

    const apiToken = process.env.GROQ_API_KEY?.trim();
    const model = process.env.GROQ_MODEL?.trim() || GROQ_MODEL;

    try {
      if (!apiToken) {
        throw new Error("Groq API key is missing");
      }

      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,
          temperature: 0.3,
          // Forces the model to emit syntactically valid JSON — this is what
          // actually retires the regex "repair" hack that used to live here.
          // It doesn't guarantee our *shape*, which is why zod still runs below.
          response_format: { type: 'json_object' },
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API error:", response.status, errorText);
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error("Groq error:", data.error);
        throw new Error(`Groq error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      if (!data.choices?.[0]?.message?.content) {
        console.error("Unexpected Groq response format");
        throw new Error("Unexpected response format from Groq");
      }

      const generatedText = data.choices[0].message.content.trim();

      try {
        const cleanedText = cleanJSONString(generatedText);
        const parsedJson = JSON.parse(cleanedText);

        const validated = fitnessPlanSchema.safeParse(parsedJson);
        if (!validated.success) {
          console.error("Fitness plan failed shape validation:", validated.error.flatten());
          return generateFallbackPlan(formData);
        }

        // Ensure all days of week exist (fills optional gaps, not syntax repair)
        return ensureCompleteFitnessPlan(validated.data);
      } catch (error) {
        console.error("Error parsing JSON response:", error);
        return generateFallbackPlan(formData);
      }
    } catch (error) {
      console.error("Error in Groq request:", error);
      return generateFallbackPlan(formData);
    }
  } catch (error) {
    console.error("Error generating fitness plan:", error);
    return generateFallbackPlan(formData);
  }
}

/**
 * Create a structured prompt for generating a fitness plan
 */
function createFitnessPlanPrompt(formData: FitnessFormData): string {
  const {
    age,
    gender,
    height,
    weight,
    primaryGoal,
    timeframe,
    activityLevel,
    experienceLevel,
    workoutDaysPerWeek,
    workoutDuration,
    preferredExercises,
    dislikedExercises,
    dietPreference,
    injuries,
    healthConditions,
    additionalInfo,
  } = formData;

  const seed = Math.floor(Math.random() * 10000);

  return `Create a detailed personalized fitness plan as JSON for:

Age: ${age || "Not specified"}
Gender: ${gender || "Not specified"}
Height: ${height || "Not specified"} cm
Weight: ${weight || "Not specified"} kg
Primary Goal: ${primaryGoal || "General fitness improvement"}
Goal Timeframe: ${timeframe || "3 months"}
Current Activity Level: ${activityLevel || "Sedentary"}
Exercise Experience: ${experienceLevel || "Beginner"}
Workout Days Per Week: ${workoutDaysPerWeek || "3-4"}
Workout Duration: ${workoutDuration || "30-45 minutes"}
Preferred Activities: ${preferredExercises || "Various exercises"}
Disliked Activities: ${dislikedExercises || "None specified"}
Diet Preference: ${dietPreference || "General"}
Injuries / Limitations: ${injuries || "None"}
Health Conditions: ${healthConditions || "None"}
Additional Info: ${additionalInfo || "None provided"}
 
Include: 
1) Personalized health summary and recommendations
2) Diet with meals and nutritional guidelines 
3) Three workout routines with detailed exercises
4) Weekly routine (all 7 days)
5) Goals and progress metrics
 
IMPORTANT:
- Create a unique plan (seed #${seed})
- KEEP VERY COMPACT to prevent truncation
- All weekly_routine days MUST have string[] workouts arrays
- Keep all property values as strings
- Be specific with exercise details considering injuries
 
JSON structure:
{
  "health_summary": {
    "overview": "",
    "recommendations": [""],
    "cautions": [""]
  },
  "diet": {
    "meals": [
      {"name": "", "description": "", "time": ""}
    ],
    "recommendations": [""],
    "restrictions": [""]
  },
  "workouts": [
    {
      "name": "",
      "description": "",
      "duration": "",
      "exercises": [
        {"name": "", "sets": "", "reps": "", "notes": ""}
      ]
    }
  ],
  "goals": {
    "short_term": [""],
    "long_term": [""],
    "metrics": {"key": "value"}
  },
  "weekly_routine": {
    "monday": {"workouts": [""], "nutrition": "", "recovery": ""},
    "tuesday": {"workouts": [""], "nutrition": "", "recovery": ""},
    "wednesday": {"workouts": [""], "nutrition": "", "recovery": ""},
    "thursday": {"workouts": [""], "nutrition": "", "recovery": ""},
    "friday": {"workouts": [""], "nutrition": "", "recovery": ""},
    "saturday": {"workouts": [""], "nutrition": "", "recovery": ""},
    "sunday": {"workouts": [""], "nutrition": "", "recovery": ""}
  }
}`;
}

/**
 * Clean JSON string by removing any text before the first '{' and after the last '}'
 */
export function cleanJSONString(text: string): string {
  // Remove markdown code blocks
  let cleanedText = text.replace(/```json|```/g, '');
  
  // Find the first '{' and last '}'
  const firstBrace = cleanedText.indexOf('{');
  const lastBrace = cleanedText.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    return cleanedText; // No JSON object found, return original
  }
  
  // Extract just the JSON part
  return cleanedText.substring(firstBrace, lastBrace + 1);
}

/**
 * Ensure all days of the week are present in the fitness plan.
 * This fills in optional gaps (e.g. a missing "sunday" key) — it does not
 * repair malformed syntax, which response_format: json_object now prevents.
 */
function ensureCompleteFitnessPlan(plan: any): FitnessPlan {
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const emptyDayRoutine = {
    workouts: ["Rest Day"],
    nutrition: "Balanced nutrition with adequate hydration",
    recovery: "Light stretching and adequate sleep"
  };
  
  // Create weekly_routine if it doesn't exist
  if (!plan.weekly_routine) {
    plan.weekly_routine = {};
  }
  
  // Ensure all days of the week are present
  daysOfWeek.forEach(day => {
    if (!plan.weekly_routine[day]) {
      plan.weekly_routine[day] = emptyDayRoutine;
    }
  });
  
  return plan as FitnessPlan;
}

/**
 * Generate a fallback fitness plan
 */
function generateFallbackPlan(formData: FitnessFormData): FitnessPlan {
  const { healthConditions } = formData;

  const planVariation = Math.floor(Math.random() * 3) + 1;
  
  return {
    health_summary: {
      overview: `Based on your profile details, this fitness plan is designed to improve your overall fitness while considering your specific needs and conditions${healthConditions ? ` including ${healthConditions}` : ''}.`,
      recommendations: [
        "Monitor your exertion levels during workouts",
        "Stay well hydrated throughout the day",
        "Track your progress weekly and adjust as needed"
      ],
      cautions: [
        "Stop any exercise that causes pain",
        "Consult with a healthcare provider before starting this program"
      ]
    },
    diet: {
      meals: [
        {
          name: "Balanced Breakfast",
          description: "Oatmeal with fruit and nuts",
          time: "Morning"
        },
        {
          name: "Protein-rich Lunch",
          description: "Grilled chicken salad with vegetables",
          time: "Afternoon"
        },
        {
          name: "Light Dinner",
          description: "Fish with steamed vegetables",
          time: "Evening"
        }
      ],
      recommendations: [
        "Stay hydrated throughout the day",
        "Eat small, frequent meals"
      ],
      restrictions: formData.dietPreference && formData.dietPreference !== 'general'
        ? [formData.dietPreference]
        : ["None specified"]
    },
    workouts: [
      {
        name: "Cardio Routine",
        description: "Basic cardio exercises",
        duration: "30 minutes",
        exercises: [
          {
            name: "Brisk Walking",
            sets: "1",
            reps: "20 minutes",
            notes: "Maintain a comfortable pace"
          },
          {
            name: "Jumping Jacks",
            sets: "3",
            reps: "20",
            notes: "Rest 30 seconds between sets"
          }
        ]
      },
      {
        name: "Strength Training",
        description: "Basic strength exercises",
        duration: "30 minutes",
        exercises: [
          {
            name: "Push-ups",
            sets: "3",
            reps: "10",
            notes: "Modify as needed for your fitness level"
          },
          {
            name: "Squats",
            sets: "3",
            reps: "15",
            notes: "Keep proper form"
          }
        ]
      },
      {
        name: "Flexibility",
        description: "Basic stretching routine",
        duration: "15 minutes",
        exercises: [
          {
            name: "Full Body Stretch",
            sets: "1",
            reps: "15 minutes",
            notes: "Hold each stretch for 30 seconds"
          }
        ]
      }
    ],
    goals: {
      short_term: ["Establish consistent exercise routine", "Improve energy levels"],
      long_term: ["Achieve target fitness goals", "Develop healthy habits"],
      metrics: {
        "weekly_workouts": "3-4",
        "daily_steps": "8000"
      }
    },
    weekly_routine: {
      monday: {
        workouts: ["Cardio Routine"],
        nutrition: "Focus on protein intake",
        recovery: "Light stretching"
      },
      tuesday: {
        workouts: ["Strength Training"],
        nutrition: "Complex carbs for energy",
        recovery: "Adequate rest"
      },
      wednesday: {
        workouts: ["Rest Day"],
        nutrition: "Balanced meals",
        recovery: "Active recovery"
      },
      thursday: {
        workouts: ["Cardio Routine"],
        nutrition: "Stay hydrated",
        recovery: "Light stretching"
      },
      friday: {
        workouts: ["Strength Training"],
        nutrition: "Protein-rich meals",
        recovery: "Adequate rest"
      },
      saturday: {
        workouts: ["Flexibility"],
        nutrition: "Balanced nutrition",
        recovery: "Self-care"
      },
      sunday: {
        workouts: ["Rest Day"],
        nutrition: "Light meals",
        recovery: "Complete rest"
      }
    }
  };
} 