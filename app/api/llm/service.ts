// OpenRouter API integration for the AI Life Coach app

// Define coaching modes
export type CoachingMode = 'career' | 'fitness' | 'finance' | 'mental' | 'general';

// Initialize OpenRouter client settings
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free';

// Define FitnessFormData type
interface FitnessFormData {
  age: string;
  gender: string;
  height: string;
  weight: string;
  fitnessLevel: string;
  fitnessGoals: string | string[];
  healthConditions?: string;
  dietaryRestrictions?: string;
  availableEquipment?: string;
  timeCommitment?: string;
  preferredActivities?: string;
  dislikedActivities?: string;
  injuries?: string;
  additionalInfo?: string;
}

// Define FitnessPlan type
interface FitnessPlan {
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
}

/**
 * Generate a fitness plan using OpenRouter API
 */
export async function generateFitnessPlan(formData: FitnessFormData): Promise<FitnessPlan> {
  try {
    console.log("Generating fitness plan using OpenRouter...");
    console.log("Form data:", JSON.stringify(formData, null, 2));
    const prompt = createFitnessPlanPrompt(formData);
    console.log("Sending prompt to OpenRouter:", prompt);

    // Define our headers and request options for OpenRouter
    const apiToken = process.env.OPENROUTER_API_KEY;
    console.log("API Token available:", !!apiToken);
    console.log("API Token first 10 chars:", apiToken?.substring(0, 10));
    console.log("API Token length:", apiToken?.length);
    const model = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free';
    console.log("Using model:", model);

    // Verify we're in a valid environment
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Site URL:", process.env.NEXT_PUBLIC_SITE_URL);

    // Improved logging around fetch request
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken?.trim()}`, // Ensure no whitespace
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://thriveai-three.vercel.app/',
          'X-Title': 'AI Life Coach'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 1200,
          temperature: 0.7
        })
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from OpenRouter:", errorText);
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log("OpenRouter response:", JSON.stringify(data, null, 2));

      // Check if the response contains an error
      if (data.error) {
        console.error("OpenRouter error:", data.error);
        throw new Error(`OpenRouter error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      // Check if the response has the expected structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        console.error("Unexpected response format:", data);
        throw new Error("Unexpected response format from OpenRouter");
      }

      const generatedText = data.choices[0].message.content.trim();
      
      // Check if the response was truncated
      const wasResponseTruncated = data.choices[0].finish_reason === 'length';
      
      if (wasResponseTruncated) {
        console.log("Response was truncated. Attempting to repair JSON...");
      }
      
      try {
        // First attempt: Try to parse the cleaned text
        const cleanedText = cleanJSONString(generatedText);
        console.log("Cleaned JSON string:", cleanedText);
        
        try {
          const fitnessPlan = JSON.parse(cleanedText);
          
          // Ensure all days of week exist
          const completePlan = ensureCompleteFitnessPlan(fitnessPlan);
          return completePlan;
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          
          // Second attempt: Try to repair the JSON
          const repairedJSON = repairJSONString(cleanedText);
          console.log("Attempting to parse repaired JSON:", repairedJSON);
          
          try {
            const repairParsed = JSON.parse(repairedJSON);
            // Ensure all days of week exist
            const completePlan = ensureCompleteFitnessPlan(repairParsed);
            return completePlan;
          } catch (repairError) {
            console.error("Failed to repair JSON:", repairError);
            // Return fallback plan if we can't fix it
            return generateFallbackPlan(formData);
          }
        }
      } catch (error) {
        console.error("Error in JSON processing:", error);
        return generateFallbackPlan(formData);
      }
    } catch (error) {
      console.error("Error in OpenRouter request:", error);
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
    fitnessLevel,
    fitnessGoals,
    healthConditions,
    dietaryRestrictions,
    availableEquipment,
    timeCommitment,
    preferredActivities,
    dislikedActivities,
    injuries,
    additionalInfo
  } = formData;

  // Generate a random seed to ensure unique results
  const seed = Math.floor(Math.random() * 10000);

  return `Create a compact personalized fitness plan as a valid JSON object for a person with the following details:
 
Age: ${age || "Not specified"}
Gender: ${gender || "Not specified"}
Height: ${height || "Not specified"}
Weight: ${weight || "Not specified"}
Fitness Level: ${fitnessLevel || "Beginner"}
Fitness Goals: ${Array.isArray(fitnessGoals) ? fitnessGoals.join(', ') : fitnessGoals || "General fitness improvement"}
Health Conditions: ${healthConditions || "None"}
Dietary Restrictions: ${dietaryRestrictions || "None"}
Available Equipment: ${availableEquipment || "Basic home equipment"}
Time Commitment: ${timeCommitment || "3-4 hours per week"}
Preferred Activities: ${preferredActivities || "Various exercises"}
Disliked Activities: ${dislikedActivities || "None specified"}
Injuries: ${injuries || "None"}
Additional Info: ${additionalInfo || "None provided"}
 
The fitness plan should include:
1. Diet with meals and recommendations (be concise but useful)
2. Three workout routines with exercises, sets, and reps
3. Weekly routine with ALL 7 DAYS of the week (brief for each day)
4. Goals and metrics
 
IMPORTANT:
- Be creative and generate a unique plan (seed #${seed})
- Keep the response VERY COMPACT to fit in token limits
- MUST include all 7 days of the week in the weekly_routine (monday through sunday)
- Using numerical values for sets and reps is fine
- Lists should be brief but descriptive
- All properties must have string values, including numbers (example: "sets": "3" not "sets": 3)
 
Provide ONLY a properly formatted JSON object matching this structure:
 
{
  "diet": {
    "meals": [
      {"name": "string", "description": "string", "time": "string"}
    ],
    "recommendations": ["string", "string"],
    "restrictions": ["string"]
  },
  "workouts": [
    {
      "name": "string",
      "description": "string",
      "duration": "string",
      "exercises": [
        {"name": "string", "sets": "string", "reps": "string", "notes": "string"}
      ]
    }
  ],
  "goals": {
    "short_term": ["string"],
    "long_term": ["string"],
    "metrics": {"key": "value"}
  },
  "weekly_routine": {
    "monday": {"workouts": ["string"], "nutrition": "string", "recovery": "string"},
    "tuesday": {"workouts": ["string"], "nutrition": "string", "recovery": "string"},
    "wednesday": {"workouts": ["string"], "nutrition": "string", "recovery": "string"},
    "thursday": {"workouts": ["string"], "nutrition": "string", "recovery": "string"},
    "friday": {"workouts": ["string"], "nutrition": "string", "recovery": "string"},
    "saturday": {"workouts": ["string"], "nutrition": "string", "recovery": "string"},
    "sunday": {"workouts": ["string"], "nutrition": "string", "recovery": "string"}
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
 * Complete and fix truncated JSON
 */
function repairJSONString(text: string): string {
  let jsonText = text;
  
  // Replace single quotes with double quotes
  jsonText = jsonText.replace(/'/g, '"');
  
  // Count opening and closing braces
  const openBraces = (jsonText.match(/{/g) || []).length;
  const closeBraces = (jsonText.match(/}/g) || []).length;
  const openBrackets = (jsonText.match(/\[/g) || []).length;
  const closeBrackets = (jsonText.match(/\]/g) || []).length;
  
  // Fix quotes around property names with numbers
  jsonText = jsonText.replace(/"([^"]+)"(\d+)":/g, '"$1$2":');
  
  // Fix Day "1" format
  jsonText = jsonText.replace(/Day "(\d+)"/g, 'Day$1');
  
  // Fix missing quotes around values with parentheses
  jsonText = jsonText.replace(/:\s*(\d+)\s*\((.*?)\)/g, ': "$1 ($2)"');
  
  // Fix missing quotes around numerical values
  jsonText = jsonText.replace(/:\s*(\d+)([,}])/g, ': "$1"$2');
  
  // Remove trailing commas that might cause parsing issues
  jsonText = jsonText.replace(/,(\s*[\]}])/g, '$1');
  
  // Add missing closing brackets
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    jsonText += ']';
  }
  
  // Add missing closing braces
  for (let i = 0; i < openBraces - closeBraces; i++) {
    jsonText += '}';
  }
  
  return jsonText;
}

/**
 * Ensure all days of the week are present in the fitness plan
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
  const { fitnessLevel, fitnessGoals, healthConditions, preferredActivities } = formData;
  
  console.log("Generating fallback fitness plan");
  
  // Add some randomization to make it seem different each time
  const planVariation = Math.floor(Math.random() * 3) + 1;
  
  return {
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
      restrictions: formData.dietaryRestrictions 
        ? [formData.dietaryRestrictions] 
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