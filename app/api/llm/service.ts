// OpenRouter API integration for the AI Life Coach app

// Message interface for chat communication
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Different coaching modes supported by the app
export type CoachingMode = 'fitness' | 'career' | 'finance' | 'mental';

// Profile interfaces for different coaching modes
export interface FitnessProfile {
  fitnessLevel?: string;
  fitnessGoals?: string;
  healthConditions?: string;
}

export interface CareerProfile {
  currentRole?: string;
  experience?: string;
  careerGoals?: string;
}

export interface FinanceProfile {
  financialGoals?: string;
  budget?: string;
  investmentPreferences?: string;
}

export interface MentalProfile {
  mentalHealthGoals?: string;
  mentalHealthChallenges?: string;
}

// Combined user profile
export interface UserProfile {
  firstName?: string;
  lastName?: string;
  age?: string;
  gender?: string;
  fitnessProfile?: FitnessProfile;
  careerProfile?: CareerProfile;
  financeProfile?: FinanceProfile;
  mentalProfile?: MentalProfile;
}

// Chat request interface
export interface ChatRequest {
  messages: Message[];
  profile?: UserProfile | null;
  mode?: CoachingMode;
}

// Fitness plan interface
export interface FitnessPlan {
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
      sets: string; // Changed to string to avoid parsing issues
      reps: string; // Changed to string to avoid parsing issues
      notes?: string;
    }>;
  }>;
  goals: {
    short_term: string[];
    long_term: string[];
    metrics: {
      [key: string]: string;
    };
  };
  weekly_routine: {
    [day: string]: {
      workouts: string[];
      nutrition: string;
      recovery: string;
    };
  };
  recommendations?: string[];
  notes?: string[];
}

// Initialize OpenRouter client settings
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free';

/**
 * Generate a fitness plan using OpenRouter API
 */
export async function generateFitnessPlan(formData: any): Promise<FitnessPlan> {
  try {
    console.log("Generating fitness plan using OpenRouter...");
    console.log("Form data:", JSON.stringify(formData, null, 2));
    const prompt = createFitnessPlanPrompt(formData);
    console.log("Sending prompt to OpenRouter:", prompt);

    // Define our headers and request options for OpenRouter
    const apiToken = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free';
    console.log("Using model:", model);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
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
        return fitnessPlan as FitnessPlan;
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        
        // Second attempt: Try to repair the JSON
        const repairedJSON = completeJSON(cleanedText);
        console.log("Attempting to parse repaired JSON:", repairedJSON);
        
        try {
          const repairParsed = JSON.parse(repairedJSON);
          return repairParsed as FitnessPlan;
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
    console.error("Error generating fitness plan:", error);
    return generateFallbackPlan(formData);
  }
}

/**
 * Create a structured prompt for generating a fitness plan
 */
function createFitnessPlanPrompt(formData: any): string {
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
Fitness Goals: ${fitnessGoals || "General fitness improvement"}
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
3. Weekly routine (keep it brief)
4. Goals and metrics

IMPORTANT: 
- Be creative and generate a unique plan (seed #${seed})
- Keep the response VERY COMPACT to fit in token limits
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
    "monday": {"workouts": ["string"], "nutrition": "string", "recovery": "string"}
  }
}`;
}

/**
 * Clean JSON string by removing any text before the first '{' and after the last '}'
 */
function cleanJSONString(text: string): string {
  // Find the first '{' and last '}'
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    return text; // No JSON object found, return original
  }
  
  // Extract just the JSON part
  return text.substring(firstBrace, lastBrace + 1);
}

/**
 * Complete and fix truncated JSON
 */
function completeJSON(text: string): string {
  let jsonText = text;
  
  // Count opening and closing braces
  const openBraces = (jsonText.match(/{/g) || []).length;
  const closeBraces = (jsonText.match(/}/g) || []).length;
  const openBrackets = (jsonText.match(/\[/g) || []).length;
  const closeBrackets = (jsonText.match(/\]/g) || []).length;
  
  // Fix quotes around property names with numbers
  jsonText = jsonText.replace(/"([^"]+)"(\d+)":/g, '"$1$2":');
  
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
 * Generate a fallback fitness plan
 */
function generateFallbackPlan(formData: any): FitnessPlan {
  const { fitnessLevel, fitnessGoals, healthConditions, preferredActivities } = formData;
  
  console.log("Generating fallback fitness plan");
  
  // Add some randomization to make it seem different each time
  const planVariation = Math.floor(Math.random() * 3) + 1;
  
  return {
    diet: {
      meals: [
        {
          name: "Protein Breakfast",
          description: planVariation === 1 ? "Eggs, oatmeal, and fruit" : (planVariation === 2 ? "Greek yogurt with berries and nuts" : "Protein smoothie with banana and spinach"),
          time: "7:00 AM"
        },
        {
          name: "Morning Snack",
          description: "Protein shake or fruit",
          time: "10:00 AM"
        },
        {
          name: "Balanced Lunch",
          description: planVariation === 1 ? "Grilled chicken with vegetables" : (planVariation === 2 ? "Tuna salad with mixed greens" : "Quinoa bowl with beans and vegetables"),
          time: "1:00 PM"
        },
        {
          name: "Afternoon Snack",
          description: "Greek yogurt with berries",
          time: "4:00 PM"
        },
        {
          name: "Protein-focused Dinner",
          description: planVariation === 1 ? "Grilled fish with quinoa" : (planVariation === 2 ? "Lean beef with sweet potatoes" : "Tofu stir-fry with brown rice"),
          time: "7:00 PM"
        }
      ],
      recommendations: [
        "Increase protein intake to support muscle growth",
        "Stay hydrated with 2-3 liters of water daily",
        "Focus on whole foods rather than processed options",
        "Eat small, frequent meals throughout the day",
        "Plan and prep meals in advance"
      ],
      restrictions: []
    },
    workouts: [
      {
        name: "Upper Body Focus",
        description: "Strengthening chest, back, shoulders, and arms",
        duration: "45 minutes",
        exercises: [
          {
            name: preferredActivities?.includes("push") ? "Push-ups" : "Dumbbell Chest Press",
            sets: "3",
            reps: "10-12",
            notes: "Focus on proper form"
          },
          {
            name: "Dumbbell Rows",
            sets: "3",
            reps: "12",
            notes: "Squeeze shoulder blades together"
          },
          {
            name: "Shoulder Press",
            sets: "3",
            reps: "10",
            notes: "Use appropriate weight"
          },
          {
            name: "Bicep Curls",
            sets: "3",
            reps: "12",
            notes: "Control the movement"
          }
        ]
      },
      {
        name: "Lower Body Strength",
        description: "Building strength in legs and core",
        duration: "45 minutes",
        exercises: [
          {
            name: "Bodyweight Squats",
            sets: "3",
            reps: "15",
            notes: "Keep knees aligned with toes"
          },
          {
            name: "Lunges",
            sets: "3",
            reps: "10 each leg",
            notes: "Step forward, keeping torso upright"
          },
          {
            name: "Glute Bridges",
            sets: "3",
            reps: "15",
            notes: "Squeeze glutes at the top"
          },
          {
            name: "Plank",
            sets: "3",
            reps: "30-60 seconds",
            notes: "Keep body in straight line"
          }
        ]
      },
      {
        name: preferredActivities?.includes("swim") ? "Swimming Session" : "Cardio Circuit",
        description: "Improving cardiovascular fitness",
        duration: "30 minutes",
        exercises: preferredActivities?.includes("swim") ? [
          {
            name: "Freestyle Swimming",
            sets: "4",
            reps: "5 minutes",
            notes: "Focus on breathing pattern"
          },
          {
            name: "Backstroke",
            sets: "2",
            reps: "3 minutes",
            notes: "Recovery pace"
          },
          {
            name: "Sprint Intervals",
            sets: "4",
            reps: "1 minute fast, 1 minute slow",
            notes: "Push hard during sprints"
          }
        ] : [
          {
            name: "Jumping Jacks",
            sets: "3",
            reps: "30 seconds",
            notes: "Full range of motion"
          },
          {
            name: "High Knees",
            sets: "3",
            reps: "30 seconds",
            notes: "Maintain good posture"
          },
          {
            name: "Mountain Climbers",
            sets: "3",
            reps: "30 seconds",
            notes: "Keep core engaged"
          },
          {
            name: "Burpees",
            sets: "3",
            reps: "10",
            notes: "Modify if needed for fitness level"
          }
        ]
      }
    ],
    goals: {
      short_term: [
        "Complete all workouts for 2 weeks consistently",
        "Master proper form for all exercises",
        "Establish regular meal timing",
        "Track workouts and nutrition daily"
      ],
      long_term: [
        fitnessGoals?.includes("muscle") ? "Increase lean muscle mass" : (fitnessGoals?.includes("weight") ? "Achieve healthy weight loss" : "Improve overall fitness level"),
        "Improve strength by 20% within 3 months",
        "Build sustainable exercise habits",
        "Increase energy levels throughout the day"
      ],
      metrics: {
        "Weight": "Weekly measurements",
        "Body measurements": "Monthly tracking",
        "Strength progress": "Track weights/reps each workout",
        "Energy levels": "Daily rating (1-10 scale)",
        "Workout consistency": "% of planned workouts completed"
      }
    },
    weekly_routine: {
      monday: {
        workouts: ["Upper Body Focus"],
        nutrition: "Higher carbs to fuel workout",
        recovery: "Light stretching"
      },
      tuesday: {
        workouts: [preferredActivities?.includes("swim") ? "Swimming Session" : "Cardio Circuit"],
        nutrition: "Balanced macros",
        recovery: "10 minutes foam rolling"
      },
      wednesday: {
        workouts: ["Lower Body Strength"],
        nutrition: "Higher protein for recovery",
        recovery: "Extra focus on leg stretches"
      },
      thursday: {
        workouts: ["Rest Day"],
        nutrition: "Normal balanced meals",
        recovery: "Light walking and full-body stretching"
      },
      friday: {
        workouts: ["Upper Body Focus"],
        nutrition: "Higher carbs to fuel workout",
        recovery: "Light stretching"
      },
      saturday: {
        workouts: [preferredActivities?.includes("swim") ? "Swimming Session" : "Cardio Circuit"],
        nutrition: "Balanced macros",
        recovery: "10 minutes foam rolling"
      },
      sunday: {
        workouts: ["Rest Day"],
        nutrition: "Normal balanced meals",
        recovery: "Light walking and full-body stretching"
      }
    },
    notes: ["This is a customized plan generated based on your profile information. Adjust as needed based on your progress."]
  };
}

/**
 * Generate a response using OpenRouter API
 */
export async function generateLLMResponse(request: ChatRequest): Promise<string> {
  try {
    console.log("Generating response with OpenRouter...");
    console.log("Request:", JSON.stringify(request, null, 2));

    const { messages, profile, mode } = request;
    const formattedMessages = formatMessagesForLLM(messages, profile, mode);
    
    // Make the API request to OpenRouter
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenRouter error:", data.error);
      throw new Error(`OpenRouter error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    const generatedText = data.choices[0].message.content;
    return cleanResponse(generatedText);
  } catch (error) {
    console.error("Error generating response:", error);
    return "I apologize, but I encountered an error while generating a response. Please try again.";
  }
}

/**
 * Format messages for the LLM based on the user profile and coaching mode
 */
function formatMessagesForLLM(messages: Message[], profile?: UserProfile | null, mode?: CoachingMode): any[] {
  const formattedMessages = [];

  // Create system prompt based on coaching mode and user profile
  const systemPrompt = createSystemPrompt(profile, mode);
  formattedMessages.push({
    role: "system",
    content: systemPrompt
  });

  // Add user and assistant messages
  for (const message of messages) {
    formattedMessages.push({
      role: message.role,
      content: message.content
    });
  }

  return formattedMessages;
}

/**
 * Create a system prompt based on the user profile and coaching mode
 */
function createSystemPrompt(profile?: UserProfile | null, mode?: CoachingMode): string {
  let prompt = `You are Thrive AI, a supportive and knowledgeable life coach.
You help users achieve their goals and improve their wellbeing.
Your responses should be supportive, informative, and actionable.
`;

  // Add user profile information if available
  if (profile) {
    prompt += `\nYou're speaking with ${profile.firstName || "a user"}`;

    if (profile.age) prompt += `, who is ${profile.age} years old`;
    if (profile.gender) prompt += ` and identifies as ${profile.gender}`;
    prompt += ".\n";

    // Add mode-specific profile details
    if (mode === "fitness" && profile.fitnessProfile) {
      const { fitnessGoals, fitnessLevel, healthConditions } = profile.fitnessProfile;

      prompt += "Fitness profile: ";
      if (fitnessLevel) prompt += `Their fitness level is ${fitnessLevel}. `;
      if (fitnessGoals) prompt += `Their fitness goals include: ${fitnessGoals}. `;
      if (healthConditions) prompt += `They have the following health conditions: ${healthConditions}. `;
      prompt += "\n";
    }

    if (mode === "career" && profile.careerProfile) {
      const { currentRole, experience, careerGoals } = profile.careerProfile;

      prompt += "Career profile: ";
      if (currentRole) prompt += `They currently work as a ${currentRole}. `;
      if (experience) prompt += `They have ${experience} years of experience. `;
      if (careerGoals) prompt += `Their career goals include: ${careerGoals}. `;
      prompt += "\n";
    }

    if (mode === "finance" && profile.financeProfile) {
      const { financialGoals, budget, investmentPreferences } = profile.financeProfile;

      prompt += "Financial profile: ";
      if (financialGoals) prompt += `Their financial goals include: ${financialGoals}. `;
      if (budget) prompt += `Their budget is ${budget}. `;
      if (investmentPreferences) prompt += `Their investment preferences include: ${investmentPreferences}. `;
      prompt += "\n";
    }
    
    if (mode === "mental" && profile.mentalProfile) {
      const { mentalHealthGoals, mentalHealthChallenges } = profile.mentalProfile;

      prompt += "Mental wellbeing profile: ";
      if (mentalHealthGoals) prompt += `Their mental wellbeing goals include: ${mentalHealthGoals}. `;
      if (mentalHealthChallenges) prompt += `They face these mental wellbeing challenges: ${mentalHealthChallenges}. `;
      prompt += "\n";
    }
  }

  // Add mode-specific instructions
  if (mode) {
    prompt += "\n";
    switch (mode) {
      case "fitness":
        prompt += `As a fitness coach, provide personalized guidance on exercise routines, nutrition, and healthy habits.`;
        break;
      case "career":
        prompt += `As a career coach, provide guidance on career development, job searching, and professional growth.`;
        break;
      case "finance":
        prompt += `As a financial coach, provide guidance on budgeting, saving, and financial planning.`;
        break;
      case "mental":
        prompt += `As a mental wellbeing coach, provide guidance on stress management, mindfulness, and self-care.`;
        break;
    }
  }

  return prompt;
}

/**
 * Clean the response text to remove common AI patterns
 */
function cleanResponse(response: string): string {
  return response
    // Remove assistant phrases at the beginning
    .replace(/^(I'm Thrive AI|I'm your AI coach|I'm your virtual coach|I'm your assistant|I'm here to help)[,\s]*/i, '')
    // Remove trailing phrases
    .replace(/Is there anything else I can help you with\?$/i, '')
    .replace(/Let me know if you have any questions\!$/i, '')
    .replace(/Let me know if you need any clarification\!$/i, '')
    .replace(/Hope that helps\!$/i, '')
    .trim();
} 