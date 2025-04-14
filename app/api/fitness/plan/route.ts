import { NextRequest, NextResponse } from 'next/server';
import { generateFitnessPlan } from '@/app/api/llm/service';

// Direct call to OpenRouter if needed as a fallback
async function directOpenRouterCall(prompt: string) {
  try {
    console.log("Making direct call to OpenRouter API");
    const apiToken = process.env.OPENROUTER_API_KEY?.trim();
    
    if (!apiToken) {
      console.error("No API token available for direct call");
      throw new Error("API key missing");
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://thriveai-three.vercel.app',
        'X-Title': 'ThriveAI'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL?.trim() || 'mistralai/mistral-7b-instruct:free',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 1200,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Direct OpenRouter API error:", errorText);
      throw new Error(`OpenRouter error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Unexpected response format");
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error in direct OpenRouter call:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body containing the form data
    const formData = await request.json();
    
    console.log('Fitness Plan API Request:', JSON.stringify(formData, null, 2));
    
    // Validate the request
    if (!formData) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing form data' }), 
        { status: 400 }
      );
    }
    
    try {
      // Generate fitness plan from LLM
      console.log('Calling generateFitnessPlan...');
      const fitnessPlan = await generateFitnessPlan(formData);
      console.log('Generated plan:', JSON.stringify(fitnessPlan, null, 2));
      
      // Return the structured fitness plan
      return NextResponse.json({ plan: fitnessPlan });
    } catch (primaryError) {
      console.error('Error generating fitness plan:', primaryError);
      
      // Try with direct API call as a last resort
      try {
        console.log('Attempting direct OpenRouter call as fallback...');
        
        // Create the prompt
        const prompt = `Create a compact personalized fitness plan as a valid JSON object for a person with the following details:
 
Age: ${formData.age || "Not specified"}
Gender: ${formData.gender || "Not specified"}
Height: ${formData.height || "Not specified"}
Weight: ${formData.weight || "Not specified"}
Fitness Level: ${formData.fitnessLevel || "Beginner"}
Fitness Goals: ${Array.isArray(formData.fitnessGoals) ? formData.fitnessGoals.join(', ') : formData.fitnessGoals || "General fitness improvement"}
Health Conditions: ${formData.healthConditions || "None"}
Dietary Restrictions: ${formData.dietaryRestrictions || "None"}
Available Equipment: ${formData.availableEquipment || "Basic home equipment"}
Time Commitment: ${formData.timeCommitment || "3-4 hours per week"}
Preferred Activities: ${formData.preferredActivities || "Various exercises"}
Disliked Activities: ${formData.dislikedActivities || "None specified"}
Injuries: ${formData.injuries || "None"}
Additional Info: ${formData.additionalInfo || "None provided"}
 
The fitness plan should include:
1. Diet with meals and recommendations (be concise but useful)
2. Three workout routines with exercises, sets, and reps
3. Weekly routine with ALL 7 DAYS of the week (brief for each day)
4. Goals and metrics
 
IMPORTANT:
- Be creative and generate a unique plan (seed #${Math.floor(Math.random() * 10000)})
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

        // Make direct call
        const jsonString = await directOpenRouterCall(prompt);
        
        try {
          // Parse the JSON response
          const cleanedString = jsonString.replace(/```json|```/g, '').trim();
          const directPlan = JSON.parse(cleanedString);
          return NextResponse.json({ 
            plan: directPlan,
            note: 'Generated via direct API call'
          });
        } catch (jsonError) {
          console.error('Error parsing direct API response:', jsonError);
          throw jsonError;
        }
      } catch (directError) {
        console.error('Error with direct OpenRouter call:', directError);
        
        // Try again with the fallback plan as last resort
        console.log('Using standard fallback plan...');
        const fallbackPlan = await generateFitnessPlan(formData);
        return NextResponse.json({ 
          plan: fallbackPlan,
          warning: 'Used fallback plan due to API errors'
        });
      }
    }
  } catch (error) {
    console.error('Error in fitness plan API route:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'An error occurred while generating your fitness plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { status: 500 }
    );
  }
}

// This is needed to configure the API route with proper CORS headers
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 