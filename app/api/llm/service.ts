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
    dietaryPreferences,
    dietaryRestrictions,
    workoutFrequency,
    workoutDuration,
    sleepHours,
    stressLevel,
    equipmentAccess
  } = formData;

  // Calculate BMI if height and weight are provided
  let bmi = '';
  if (height && weight) {
    // Convert height to meters if in cm
    const heightInMeters = height > 3 ? height / 100 : height;
    const bmiValue = weight / (heightInMeters * heightInMeters);
    bmi = `BMI: ${bmiValue.toFixed(1)} (${getBMICategory(bmiValue)})`;
  }

  return `
Create a personalized fitness plan in JSON format based on the following information:

User Profile:
- Age: ${age || 'Not specified'}
- Gender: ${gender || 'Not specified'}
- Height: ${height || 'Not specified'}
- Weight: ${weight || 'Not specified'}
- ${bmi}
- Current Fitness Level: ${fitnessLevel || 'Not specified'}
- Fitness Goals: ${fitnessGoals || 'Not specified'}
- Health Conditions/Limitations: ${healthConditions || 'None'}
- Dietary Preferences: ${dietaryPreferences || 'Not specified'}
- Dietary Restrictions: ${dietaryRestrictions || 'None'}
- Workout Frequency Preference: ${workoutFrequency || 'Not specified'} times per week
- Workout Duration Preference: ${workoutDuration || 'Not specified'} minutes
- Sleep Hours: ${sleepHours || 'Not specified'} hours per night
- Stress Level: ${stressLevel || 'Not specified'}
- Equipment Access: ${equipmentAccess || 'Not specified'}

Requirements:
1. Create a comprehensive fitness plan tailored to this individual's profile.
2. Include dietary recommendations with meal suggestions.
3. Design appropriate workouts with exercise details.
4. Set realistic short-term and long-term goals.
5. Create a weekly routine that balances different types of exercise.
6. Include recommendations for recovery and sustainability.
7. If there are health conditions, ensure the plan is safe and appropriate.
8. Respect dietary preferences and restrictions.

The response MUST be valid JSON that matches this structure:
{
  "diet": {
    "meals": [
      {
        "name": "Breakfast Example",
        "description": "Detailed description of the meal",
        "time": "7:00 AM"
      }
    ],
    "recommendations": ["List of dietary recommendations"],
    "restrictions": ["List of dietary restrictions to follow"]
  },
  "workouts": [
    {
      "name": "Workout Name",
      "description": "Description of the workout",
      "duration": "45 minutes",
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": "3",
          "reps": "12",
          "notes": "Optional notes about form or alternatives"
        }
      ]
    }
  ],
  "goals": {
    "short_term": ["List of short-term goals"],
    "long_term": ["List of long-term goals"],
    "metrics": {
      "weight": "Target weight",
      "bodyFat": "Target body fat percentage",
      "other_relevant_metrics": "values"
    }
  },
  "weekly_routine": {
    "monday": {
      "workouts": ["Names of Monday workouts"],
      "nutrition": "Special nutrition focus for Monday",
      "recovery": "Recovery activities for Monday"
    },
    ... other days of the week
  },
  "recommendations": ["Additional recommendations"],
  "notes": ["Important notes about the plan"]
}

Important: Ensure the plan is realistic, sustainable, and tailored to the individual's specific needs. Provide clear, actionable advice that can be followed without professional supervision. If there are any health concerns, recommend consulting with a healthcare professional.
`;
}

/**
 * Helper function to get BMI category
 */
function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obesity';
}

/**
 * Clean up a JSON string to fix common issues
 */
function cleanJSONString(str: string): string {
  // Escape backslashes
  let cleaned = str;
  
  // Extract JSON if it's wrapped in markdown code blocks
  const jsonRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/;
  const match = str.match(jsonRegex);
  
  if (match && match[1]) {
    cleaned = match[1];
  }
  
  // Remove any leading/trailing non-JSON content
  const jsonStartRegex = /^[^{]*(({[\s\S]*)/;
  const startMatch = cleaned.match(jsonStartRegex);
  if (startMatch) {
    cleaned = startMatch[1];
  }
  
  const jsonEndRegex = /([\s\S]*})[^}]*$/;
  const endMatch = cleaned.match(jsonEndRegex);
  if (endMatch) {
    cleaned = endMatch[1];
  }
  
  return cleaned;
}

/**
 * Attempt to repair incomplete JSON
 */
function completeJSON(str: string): string {
  try {
    // Count opening and closing braces, brackets
    const openBraces = (str.match(/{/g) || []).length;
    const closeBraces = (str.match(/}/g) || []).length;
    const openBrackets = (str.match(/\[/g) || []).length;
    const closeBrackets = (str.match(/\]/g) || []).length;
    
    let fixed = str;
    
    // Add missing closing braces
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += '}';
    }
    
    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixed += ']';
    }
    
    // Fix common JSON syntax errors
    fixed = fixed
      // Fix trailing commas before closing brackets/braces
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      // Fix missing quotes around property names
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
      // Fix unquoted string values
      .replace(/:(\s*)([a-zA-Z0-9_]+)([,}])/g, ':"$2"$3');
    
    return fixed;
  } catch (e) {
    console.error("Error while trying to complete JSON:", e);
    return str;
  }
}

/**
 * Generate a fallback fitness plan when the API fails
 */
function generateFallbackPlan(formData: any): FitnessPlan {
  const {
    fitnessGoals = "Improve overall fitness",
    healthConditions = "",
    dietaryPreferences = "",
    dietaryRestrictions = "",
    fitnessLevel = "Beginner"
  } = formData;
  
  const isLowImpact = healthConditions.toLowerCase().includes('injury') || 
                       healthConditions.toLowerCase().includes('pain') ||
                       healthConditions.toLowerCase().includes('arthritis');
  
  const workoutIntensity = fitnessLevel.toLowerCase() === 'beginner' ? 'Low' : 
                           fitnessLevel.toLowerCase() === 'intermediate' ? 'Moderate' : 'High';
  
  return {
    diet: {
      meals: [
        {
          name: "Balanced Breakfast",
          description: "Oatmeal with fruits, nuts, and a side of protein (eggs or yogurt)",
          time: "7:00 AM"
        },
        {
          name: "Midday Meal",
          description: "Lean protein with vegetables and complex carbohydrates",
          time: "12:00 PM"
        },
        {
          name: "Evening Meal",
          description: "Lean protein, vegetables, and healthy fats",
          time: "6:30 PM"
        }
      ],
      recommendations: [
        "Stay hydrated by drinking at least 8 glasses of water daily",
        "Focus on whole foods rather than processed items",
        "Balance macronutrients (protein, carbs, fats) in each meal",
        "Consider portion sizes to align with your goals"
      ],
      restrictions: dietaryRestrictions ? [dietaryRestrictions] : []
    },
    workouts: [
      {
        name: isLowImpact ? "Low-Impact Full Body Workout" : "Full Body Strength Training",
        description: `A balanced workout targeting all major muscle groups with ${workoutIntensity.toLowerCase()} intensity`,
        duration: "45 minutes",
        exercises: [
          {
            name: isLowImpact ? "Wall Push-Ups" : "Push-Ups",
            sets: "3",
            reps: fitnessLevel.toLowerCase() === 'beginner' ? "8" : "12",
            notes: "Focus on proper form rather than quantity"
          },
          {
            name: isLowImpact ? "Chair Squats" : "Bodyweight Squats",
            sets: "3",
            reps: "15",
            notes: "Keep your knees aligned with your toes"
          },
          {
            name: "Plank",
            sets: "3",
            reps: "30 seconds",
            notes: "Maintain a straight line from head to heels"
          }
        ]
      },
      {
        name: "Cardiovascular Training",
        description: isLowImpact ? "Low-impact cardio to improve heart health" : "Cardio session to improve endurance and burn calories",
        duration: "30 minutes",
        exercises: [
          {
            name: isLowImpact ? "Walking" : "Jogging",
            sets: "1",
            reps: "30 minutes",
            notes: "Maintain a consistent pace that challenges you"
          }
        ]
      }
    ],
    goals: {
      short_term: [
        "Establish a consistent workout routine",
        "Improve energy levels through better nutrition",
        "Develop proper exercise form"
      ],
      long_term: [
        fitnessGoals || "Improve overall fitness and health",
        "Build sustainable healthy habits",
        "Increase strength and endurance"
      ],
      metrics: {
        consistency: "3-4 workouts per week",
        energy: "Improved daily energy levels",
        strength: "Gradual increase in exercise capacity"
      }
    },
    weekly_routine: {
      monday: {
        workouts: ["Full Body Strength Training"],
        nutrition: "Focus on protein intake for muscle recovery",
        recovery: "Light stretching in the evening"
      },
      tuesday: {
        workouts: ["Cardiovascular Training"],
        nutrition: "Balanced macronutrients",
        recovery: "Adequate hydration"
      },
      wednesday: {
        workouts: ["Rest Day"],
        nutrition: "Balanced diet, focus on vegetables",
        recovery: "Light walking and stretching"
      },
      thursday: {
        workouts: ["Full Body Strength Training"],
        nutrition: "Focus on protein intake for muscle recovery",
        recovery: "Light stretching in the evening"
      },
      friday: {
        workouts: ["Cardiovascular Training"],
        nutrition: "Balanced macronutrients",
        recovery: "Adequate hydration"
      },
      saturday: {
        workouts: ["Active Recovery (light walking or yoga)"],
        nutrition: "Balanced diet",
        recovery: "Extra stretching or foam rolling"
      },
      sunday: {
        workouts: ["Rest Day"],
        nutrition: "Balanced diet",
        recovery: "Complete rest, focus on quality sleep"
      }
    },
    recommendations: [
      "Listen to your body and adjust intensity as needed",
      "Consistency is more important than perfection",
      "Get 7-9 hours of quality sleep each night",
      "Consider tracking your progress to stay motivated"
    ],
    notes: healthConditions ? 
      ["This is a generic plan. Please consult with a healthcare professional before starting, given your health conditions."] : 
      ["This plan can be adjusted as you progress and your fitness level improves."]
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