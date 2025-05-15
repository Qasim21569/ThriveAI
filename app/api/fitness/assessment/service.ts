// Fitness Assessment Service

// Types
interface FitnessFormData {
  // Basic Information
  age: string;
  height: string;
  weight: string;
  gender: string;

  // Fitness Goals
  primaryGoal: string;
  timeframe: string;

  // Current Fitness Level
  activityLevel: string;
  experienceLevel: string;

  // Preferences
  workoutDaysPerWeek: string;
  workoutDuration: string;
  preferredExercises: string;
  dislikedExercises: string;
  dietPreference: string; // New field for diet preference

  // Health Considerations
  injuries: string;
  healthConditions: string;

  // Additional Information
  additionalInfo: string;
}

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

/**
 * Create a structured prompt for generating a fitness assessment
 */
function createFitnessAssessmentPrompt(formData: FitnessFormData): string {
  const {
    // Basic Information
    age,
    height,
    weight,
    gender,

    // Fitness Goals
    primaryGoal,
    timeframe,

    // Current Fitness Level
    activityLevel,
    experienceLevel,

    // Preferences
    workoutDaysPerWeek,
    workoutDuration,
    preferredExercises,
    dislikedExercises,
    dietPreference,

    // Health Considerations
    injuries,
    healthConditions,

    // Additional Information
    additionalInfo
  } = formData;

  // Calculate BMI for reference (simple calculation)
  const heightInM = parseFloat(height) / 100; // Convert cm to m
  const weightInKg = parseFloat(weight);
  const bmi = heightInM > 0 ? (weightInKg / (heightInM * heightInM)).toFixed(1) : "N/A";

  // Determine diet approach based on preference
  let dietApproach;
  switch (dietPreference) {
    case 'vegetarian':
      dietApproach = "Vegetarian diet focusing on plant proteins like legumes, tofu, tempeh, and dairy for complete protein sources.";
      break;
    case 'vegan':
      dietApproach = "Vegan diet with emphasis on complete plant protein combinations, B12 supplementation, and varied plant foods for full nutrition.";
      break;
    case 'non-vegetarian':
      dietApproach = "Balanced diet including lean animal proteins like chicken, fish, eggs along with plant-based foods.";
      break;
    default:
      dietApproach = "Balanced nutrition approach tailored to individual needs and preferences.";
  }

  return `Create a deeply personalized fitness assessment as JSON for someone with the following attributes:

BASIC INFORMATION:
- Age: ${age}
- Height: ${height} cm
- Weight: ${weight} kg
- BMI: ${bmi}
- Gender: ${gender}
 
FITNESS GOALS:
- Primary Goal: ${primaryGoal}
- Desired Timeframe: ${timeframe}

CURRENT FITNESS LEVEL:
- Activity Level: ${activityLevel}
- Exercise Experience: ${experienceLevel}

PREFERENCES:
- Workout Days Per Week: ${workoutDaysPerWeek}
- Workout Duration: ${workoutDuration}
- Preferred Exercises: ${preferredExercises}
- Disliked Exercises: ${dislikedExercises}
- Diet Preference: ${dietPreference || "Not specified"}

HEALTH CONSIDERATIONS:
- Injuries/Limitations: ${injuries}
- Health Conditions: ${healthConditions}

ADDITIONAL INFORMATION:
- Extra Context: ${additionalInfo || "None provided"}

Create a comprehensive fitness assessment that feels like it was written by a knowledgeable, supportive fitness coach who truly cares about this person's journey. Include:

1) A warm, personal greeting that acknowledges their fitness goals and current situation
2) An overview with a summary, strengths, and areas to improve
3) Assessment of physical status and current fitness level
4) Analysis of their fitness goals and feasibility within the timeframe
5) Personalized training recommendations based on preferences and limitations
6) Nutrition guidance based on their dietary preference (${dietPreference || "general"})
7) A concrete, actionable plan divided into immediate, short-term, and long-term actions
8) Health considerations and modifications for any injuries or conditions
9) 3-5 personal insights that help them understand their unique fitness journey

IMPORTANT:
- Use a warm, conversational tone as if speaking directly to the person
- Reference their specific answers and circumstances throughout
- Acknowledge their current fitness level without judgment
- Connect their diet preference (${dietPreference || "not specified"}) to their goals
- Provide specific nutrition guidance based on the diet approach: ${dietApproach}
- Recognize their personal strengths and build on them
- Be empathetic and encouraging in tone
- Provide actionable advice grounded in exercise science
- Adapt all recommendations to their injuries and health conditions
- Make the assessment feel personally tailored, not generic

JSON structure:
{
  "greeting": "",
  "overview": {
    "summary": "",
    "strengths": ["","",""],
    "areas_to_improve": ["","",""]
  },
  "physical_assessment": {
    "body_composition": {
      "score": "",
      "summary": "",
      "recommendations": ["","",""]
    },
    "current_fitness": {
      "score": "",
      "summary": "",
      "recommendations": ["","",""]
    }
  },
  "goal_assessment": {
    "goal_feasibility": "",
    "timeframe_analysis": "",
    "personalized_goals": ["","",""]
  },
  "training_recommendations": {
    "workout_types": ["","",""],
    "frequency": "",
    "intensity": "",
    "progression": ["","",""]
  },
  "nutrition_recommendations": {
    "diet_type": "",
    "meal_structure": "",
    "key_nutrients": ["","",""],
    "diet_tips": ["","",""]
  },
  "action_plan": {
    "immediate": ["","",""],
    "short_term": ["","",""],
    "long_term": ["","",""]
  },
  "health_considerations": {
    "cautions": ["",""],
    "modifications": ["",""]
  },
  "personal_insights": ["","","","",""]
}`;
}

/**
 * Generate a fitness assessment using OpenRouter API
 */
export async function generateFitnessAssessment(formData: FitnessFormData): Promise<FitnessAssessment> {
  try {
    console.log("Generating fitness assessment using OpenRouter...");
    console.log("Form data:", JSON.stringify(formData, null, 2));
    const prompt = createFitnessAssessmentPrompt(formData);
    console.log("Sending prompt to OpenRouter:", prompt);

    // Define our headers and request options for OpenRouter
    const apiToken = process.env.OPENROUTER_API_KEY?.trim();
    console.log("API Token available:", !!apiToken);
    console.log("API Token first 10 chars:", apiToken?.substring(0, 10));
    const model = process.env.OPENROUTER_MODEL?.trim() || 'deepseek/deepseek-r1:free';
    console.log("Using model:", model);

    // Verify we're in a valid environment
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Site URL:", process.env.NEXT_PUBLIC_SITE_URL);

    try {
      if (!apiToken) {
        console.error("No API token found - cannot make OpenRouter request");
        throw new Error("OpenRouter API key is missing");
      }

      // Format the headers properly for OpenRouter
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://thriveai-three.vercel.app',
        'X-Title': 'AI Life Coach'
      };

      console.log("Using headers:", JSON.stringify({
        'Content-Type': headers['Content-Type'],
        'Authorization': 'Bearer [REDACTED]',
        'HTTP-Referer': headers['HTTP-Referer'],
        'X-Title': headers['X-Title']
      }));

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1:free',
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 4000,
          temperature: 0.3,
          route: "fallback",
          data_privacy: {
            prompt_training: true,
            prompt_public: true
          }
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

      try {
        // Clean and parse the response
        const cleanedText = cleanJSONString(generatedText);
        console.log("Cleaned JSON string:", cleanedText);

        try {
          const assessment = JSON.parse(cleanedText);
          return ensureValidAssessment(assessment);
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          return generateFallbackAssessment(formData);
        }
      } catch (error) {
        console.error("Error in JSON processing:", error);
        return generateFallbackAssessment(formData);
      }
    } catch (error) {
      console.error("Error in OpenRouter request:", error);
      return generateFallbackAssessment(formData);
    }
  } catch (error) {
    console.error("Error generating fitness assessment:", error);
    return generateFallbackAssessment(formData);
  }
}

/**
 * Clean JSON string by removing any text before the first '{' and after the last '}'
 */
function cleanJSONString(text: string): string {
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
 * Ensure all required properties are present in the assessment
 */
function ensureValidAssessment(assessment: any): FitnessAssessment {
  // Deep clone to avoid mutating the original
  const validAssessment = JSON.parse(JSON.stringify(assessment));

  // Ensure greeting exists
  if (!validAssessment.greeting) {
    validAssessment.greeting = "Thank you for completing this fitness assessment. I'm excited to help you on your fitness journey.";
  }

  // Ensure overview exists
  if (!validAssessment.overview) {
    validAssessment.overview = {
      summary: "Based on your responses, we've created a personalized fitness assessment to help you reach your goals.",
      strengths: ["Commitment to fitness", "Clear goals", "Self-awareness"],
      areas_to_improve: ["Consistency", "Balanced approach", "Recovery"]
    };
  } else {
    // Ensure overview properties
    if (!validAssessment.overview.summary) {
      validAssessment.overview.summary = "Based on your responses, we've created a personalized fitness assessment.";
    }
    if (!validAssessment.overview.strengths || !Array.isArray(validAssessment.overview.strengths)) {
      validAssessment.overview.strengths = ["Commitment to fitness", "Clear goals", "Self-awareness"];
    }
    if (!validAssessment.overview.areas_to_improve || !Array.isArray(validAssessment.overview.areas_to_improve)) {
      validAssessment.overview.areas_to_improve = ["Consistency", "Balanced approach", "Recovery"];
    }
  }

  // Ensure physical_assessment exists
  if (!validAssessment.physical_assessment) {
    validAssessment.physical_assessment = {
      body_composition: {
        score: "Average",
        summary: "Your body composition indicates room for improvement with the right approach.",
        recommendations: ["Focus on both nutrition and exercise", "Build lean muscle mass", "Progressive approach to fitness"]
      },
      current_fitness: {
        score: "Developing",
        summary: "Your current fitness level provides a foundation to build upon.",
        recommendations: ["Start with foundational movements", "Gradually increase intensity", "Focus on proper form"]
      }
    };
  } else {
    // Ensure body_composition exists
    if (!validAssessment.physical_assessment.body_composition) {
      validAssessment.physical_assessment.body_composition = {
        score: "Average",
        summary: "Your body composition indicates room for improvement with the right approach.",
        recommendations: ["Focus on both nutrition and exercise", "Build lean muscle mass", "Progressive approach to fitness"]
      };
    } else {
      // Ensure body_composition properties
      if (!validAssessment.physical_assessment.body_composition.score) {
        validAssessment.physical_assessment.body_composition.score = "Average";
      }
      if (!validAssessment.physical_assessment.body_composition.summary) {
        validAssessment.physical_assessment.body_composition.summary = "Your body composition indicates room for improvement with the right approach.";
      }
      if (!validAssessment.physical_assessment.body_composition.recommendations || !Array.isArray(validAssessment.physical_assessment.body_composition.recommendations)) {
        validAssessment.physical_assessment.body_composition.recommendations = ["Focus on both nutrition and exercise", "Build lean muscle mass", "Progressive approach to fitness"];
      }
    }

    // Ensure current_fitness exists
    if (!validAssessment.physical_assessment.current_fitness) {
      validAssessment.physical_assessment.current_fitness = {
        score: "Developing",
        summary: "Your current fitness level provides a foundation to build upon.",
        recommendations: ["Start with foundational movements", "Gradually increase intensity", "Focus on proper form"]
      };
    } else {
      // Ensure current_fitness properties
      if (!validAssessment.physical_assessment.current_fitness.score) {
        validAssessment.physical_assessment.current_fitness.score = "Developing";
      }
      if (!validAssessment.physical_assessment.current_fitness.summary) {
        validAssessment.physical_assessment.current_fitness.summary = "Your current fitness level provides a foundation to build upon.";
      }
      if (!validAssessment.physical_assessment.current_fitness.recommendations || !Array.isArray(validAssessment.physical_assessment.current_fitness.recommendations)) {
        validAssessment.physical_assessment.current_fitness.recommendations = ["Start with foundational movements", "Gradually increase intensity", "Focus on proper form"];
      }
    }
  }

  // Ensure goal_assessment exists
  if (!validAssessment.goal_assessment) {
    validAssessment.goal_assessment = {
      goal_feasibility: "Your goals are achievable with consistent effort and the right approach.",
      timeframe_analysis: "The timeframe you've set is realistic for seeing meaningful progress.",
      personalized_goals: ["Improve overall strength", "Enhance cardiovascular fitness", "Develop healthier habits"]
    };
  } else {
    // Ensure goal_assessment properties
    if (!validAssessment.goal_assessment.goal_feasibility) {
      validAssessment.goal_assessment.goal_feasibility = "Your goals are achievable with consistent effort and the right approach.";
    }
    if (!validAssessment.goal_assessment.timeframe_analysis) {
      validAssessment.goal_assessment.timeframe_analysis = "The timeframe you've set is realistic for seeing meaningful progress.";
    }
    if (!validAssessment.goal_assessment.personalized_goals || !Array.isArray(validAssessment.goal_assessment.personalized_goals)) {
      validAssessment.goal_assessment.personalized_goals = ["Improve overall strength", "Enhance cardiovascular fitness", "Develop healthier habits"];
    }
  }

  // Ensure training_recommendations exists
  if (!validAssessment.training_recommendations) {
    validAssessment.training_recommendations = {
      workout_types: ["Strength training", "Cardiovascular exercise", "Flexibility work"],
      frequency: "3-4 days per week",
      intensity: "Moderate, gradually increasing over time",
      progression: ["Add weight or resistance", "Increase workout duration", "Reduce rest periods"]
    };
  } else {
    // Ensure training_recommendations properties
    if (!validAssessment.training_recommendations.workout_types || !Array.isArray(validAssessment.training_recommendations.workout_types)) {
      validAssessment.training_recommendations.workout_types = ["Strength training", "Cardiovascular exercise", "Flexibility work"];
    }
    if (!validAssessment.training_recommendations.frequency) {
      validAssessment.training_recommendations.frequency = "3-4 days per week";
    }
    if (!validAssessment.training_recommendations.intensity) {
      validAssessment.training_recommendations.intensity = "Moderate, gradually increasing over time";
    }
    if (!validAssessment.training_recommendations.progression || !Array.isArray(validAssessment.training_recommendations.progression)) {
      validAssessment.training_recommendations.progression = ["Add weight or resistance", "Increase workout duration", "Reduce rest periods"];
    }
  }

  // Ensure nutrition_recommendations exists
  if (!validAssessment.nutrition_recommendations) {
    validAssessment.nutrition_recommendations = {
      diet_type: "Balanced nutrition with adequate protein",
      meal_structure: "3 main meals with 1-2 snacks",
      key_nutrients: ["Protein", "Complex carbohydrates", "Healthy fats"],
      diet_tips: ["Focus on whole foods", "Stay hydrated", "Eat mindfully"]
    };
  } else {
    // Ensure nutrition_recommendations properties
    if (!validAssessment.nutrition_recommendations.diet_type) {
      validAssessment.nutrition_recommendations.diet_type = "Balanced nutrition with adequate protein";
    }
    if (!validAssessment.nutrition_recommendations.meal_structure) {
      validAssessment.nutrition_recommendations.meal_structure = "3 main meals with 1-2 snacks";
    }
    if (!validAssessment.nutrition_recommendations.key_nutrients || !Array.isArray(validAssessment.nutrition_recommendations.key_nutrients)) {
      validAssessment.nutrition_recommendations.key_nutrients = ["Protein", "Complex carbohydrates", "Healthy fats"];
    }
    if (!validAssessment.nutrition_recommendations.diet_tips || !Array.isArray(validAssessment.nutrition_recommendations.diet_tips)) {
      validAssessment.nutrition_recommendations.diet_tips = ["Focus on whole foods", "Stay hydrated", "Eat mindfully"];
    }
  }

  // Ensure action_plan exists
  if (!validAssessment.action_plan) {
    validAssessment.action_plan = {
      immediate: ["Schedule your workout days", "Stock your kitchen with healthy foods", "Prepare workout clothes and gear"],
      short_term: ["Establish a consistent workout routine", "Track your progress", "Adjust nutrition as needed"],
      long_term: ["Continually challenge yourself", "Reassess goals every 8-12 weeks", "Celebrate achievements"]
    };
  } else {
    // Ensure action_plan properties
    if (!validAssessment.action_plan.immediate || !Array.isArray(validAssessment.action_plan.immediate)) {
      validAssessment.action_plan.immediate = ["Schedule your workout days", "Stock your kitchen with healthy foods", "Prepare workout clothes and gear"];
    }
    if (!validAssessment.action_plan.short_term || !Array.isArray(validAssessment.action_plan.short_term)) {
      validAssessment.action_plan.short_term = ["Establish a consistent workout routine", "Track your progress", "Adjust nutrition as needed"];
    }
    if (!validAssessment.action_plan.long_term || !Array.isArray(validAssessment.action_plan.long_term)) {
      validAssessment.action_plan.long_term = ["Continually challenge yourself", "Reassess goals every 8-12 weeks", "Celebrate achievements"];
    }
  }

  // Ensure health_considerations exists
  if (!validAssessment.health_considerations) {
    validAssessment.health_considerations = {
      cautions: ["Stop if you experience pain", "Consult a doctor before beginning"],
      modifications: ["Adapt exercises to your ability level", "Focus on proper form over intensity"]
    };
  } else {
    // Ensure health_considerations properties
    if (!validAssessment.health_considerations.cautions || !Array.isArray(validAssessment.health_considerations.cautions)) {
      validAssessment.health_considerations.cautions = ["Stop if you experience pain", "Consult a doctor before beginning"];
    }
    if (!validAssessment.health_considerations.modifications || !Array.isArray(validAssessment.health_considerations.modifications)) {
      validAssessment.health_considerations.modifications = ["Adapt exercises to your ability level", "Focus on proper form over intensity"];
    }
  }

  // Ensure personal_insights exists
  if (!validAssessment.personal_insights || !Array.isArray(validAssessment.personal_insights)) {
    validAssessment.personal_insights = [
      "Your approach to fitness reflects your personality and preferences.",
      "The way you've described your goals indicates you're motivated by results and progress.",
      "Your fitness journey will be unique to you, and that's exactly as it should be."
    ];
  }

  return validAssessment as FitnessAssessment;
}

/**
 * Generate a fallback assessment when the API fails
 */
function generateFallbackAssessment(formData: FitnessFormData): FitnessAssessment {
  console.log("Generating fallback fitness assessment");

  // Extract basic info to personalize the fallback
  const age = parseInt(formData.age) || 30;
  const isMale = formData.gender === 'male';
  const goalType = formData.primaryGoal || 'overall-fitness';
  const experience = formData.experienceLevel || 'beginner';
  const hasMobility = formData.injuries.toLowerCase().includes('mobility')
    || formData.injuries.toLowerCase().includes('flexibility');
  const hasJointIssues = formData.injuries.toLowerCase().includes('joint')
    || formData.injuries.toLowerCase().includes('knee')
    || formData.injuries.toLowerCase().includes('back');
  const dietType = formData.dietPreference || 'general';

  // Personalize the diet recommendations based on preference
  let dietRecommendations = {
    diet_type: "Balanced nutrition with adequate protein",
    meal_structure: "3 main meals with 1-2 snacks",
    key_nutrients: ["Protein", "Complex carbohydrates", "Healthy fats"],
    diet_tips: ["Focus on whole foods", "Stay hydrated", "Eat mindfully"]
  };

  if (dietType === 'vegetarian') {
    dietRecommendations = {
      diet_type: "Vegetarian diet with complete proteins",
      meal_structure: "3 balanced meals with protein-rich snacks",
      key_nutrients: ["Plant proteins", "Iron", "Vitamin B12", "Zinc"],
      diet_tips: [
        "Combine legumes with grains for complete proteins",
        "Include dairy or eggs for essential nutrients",
        "Consider B12 supplementation if mostly plant-based",
        "Focus on iron-rich foods like spinach and lentils"
      ]
    };
  } else if (dietType === 'vegan') {
    dietRecommendations = {
      diet_type: "Plant-based vegan nutrition",
      meal_structure: "Frequent, nutrient-dense meals throughout the day",
      key_nutrients: ["Complete plant proteins", "Vitamin B12", "Iron", "Omega-3 fatty acids", "Calcium"],
      diet_tips: [
        "Use protein combining (beans + rice, hummus + pita)",
        "Take B12 supplements regularly",
        "Include algae oil or flaxseeds for omega-3s",
        "Eat iron-rich foods with vitamin C for better absorption",
        "Use fortified plant milks for calcium and vitamin D"
      ]
    };
  } else if (dietType === 'non-vegetarian') {
    dietRecommendations = {
      diet_type: "Omnivorous diet with lean proteins",
      meal_structure: "3 balanced meals emphasizing protein and vegetables",
      key_nutrients: ["Complete proteins", "Essential fatty acids", "Iron", "Zinc"],
      diet_tips: [
        "Choose lean meats and fish as protein sources",
        "Limit red meat to 1-2 times per week",
        "Include fatty fish for omega-3s",
        "Balance animal proteins with plenty of vegetables and whole grains",
        "Vary protein sources for nutritional diversity"
      ]
    };
  }

  return {
    greeting: `Thank you for sharing your fitness goals and current situation. As a ${experience} with a primary goal of ${goalType.replace('-', ' ')}, I'm excited to help you create an effective approach that works for your ${age}-year-old body and lifestyle preferences.`,

    overview: {
      summary: `Based on your details as a ${experience} looking to ${goalType.replace('-', ' ')}, we've created a personalized fitness assessment that accounts for your ${formData.workoutDaysPerWeek} days per week availability and ${dietType} dietary preference. This plan will guide you toward your goals within your ${formData.timeframe} timeframe.`,

      strengths: [
        `Your clear focus on ${goalType.replace('-', ' ')} as your main goal`,
        `Willingness to dedicate ${formData.workoutDaysPerWeek} days per week to your fitness`,
        `Self-awareness about your ${experience} level and physical limitations`
      ],

      areas_to_improve: [
        experience === 'beginner' ? "Building foundational fitness knowledge and movement patterns" : "Advancing your training methodology for continued progress",
        "Creating consistent habits that support your fitness goals",
        hasJointIssues ? "Working around your joint limitations safely" : "Optimizing recovery between workouts"
      ]
    },

    physical_assessment: {
      body_composition: {
        score: "Baseline established",
        summary: `Based on your height, weight, age, and gender, we have a starting point to track progress from. Your current body composition is typical for a ${age}-year-old ${isMale ? 'male' : 'female'} with your activity level.`,
        recommendations: [
          goalType.includes('weight-loss') ? "Focus on creating a sustainable calorie deficit through diet and exercise" : "Emphasize protein intake to support muscle development",
          "Take baseline measurements beyond weight (photos, measurements, fitness tests)",
          "Set body composition goals based on health metrics, not just appearance"
        ]
      },

      current_fitness: {
        score: experience === 'beginner' ? "Developing" : (experience === 'intermediate' ? "Established" : "Advanced"),
        summary: `As a ${experience} with ${formData.activityLevel} activity level, you have ${experience === 'beginner' ? 'room to improve across all fitness components' : 'a good foundation to build upon'}.`,
        recommendations: [
          experience === 'beginner' ? "Start with fundamental movement patterns and technique" : "Focus on progressive overload and periodization",
          hasMobility ? "Incorporate mobility work into every session" : "Include both strength and cardiovascular training",
          "Track your progress to stay motivated and adjust as needed"
        ]
      }
    },

    goal_assessment: {
      goal_feasibility: `Your goal of ${goalType.replace('-', ' ')} is ${formData.timeframe === '1-month' ? 'ambitious but possible to start seeing initial changes' : 'realistic'} within your ${formData.timeframe} timeframe, especially with ${formData.workoutDaysPerWeek} days of training per week.`,

      timeframe_analysis: formData.timeframe === '1-month'
        ? "One month is enough time to establish habits and see initial changes, but significant physical transformations typically require 8-12 weeks minimum."
        : (formData.timeframe === '3-months'
          ? "Three months is an excellent timeframe for seeing measurable results in both performance and body composition with consistent effort."
          : "Your extended timeframe will allow for sustainable progress and habit formation, which increases long-term success."),

      personalized_goals: [
        goalType === 'weight-loss'
          ? "Achieve a sustainable calorie deficit through combined nutrition and exercise approaches"
          : (goalType === 'muscle-gain'
            ? "Progressive strength increases across major muscle groups"
            : "Improved overall functional fitness"),
        experience === 'beginner'
          ? "Master proper form in fundamental movement patterns"
          : "Overcome plateaus through training variation",
        "Establish consistency in both workout schedule and nutrition"
      ]
    },

    training_recommendations: {
      workout_types: [
        goalType === 'weight-loss' || goalType === 'endurance'
          ? "Combined strength and cardio circuits"
          : (goalType === 'muscle-gain' || goalType === 'strength'
            ? "Hypertrophy-focused resistance training"
            : "Balanced resistance and cardiovascular training"),
        hasMobility
          ? "Mobility-focused movement preparation"
          : "Dynamic warm-ups before each session",
        hasJointIssues
          ? "Low-impact cardiovascular activities (swimming, cycling)"
          : "Mixed-impact cardio for metabolic conditioning"
      ],

      frequency: formData.workoutDaysPerWeek,

      intensity: experience === 'beginner'
        ? "Start with low-to-moderate intensity, focusing on technique"
        : (experience === 'intermediate'
          ? "Moderate to challenging intensity with proper progression"
          : "Varied intensity following periodized approach"),

      progression: [
        "Increase weights or resistance when current level feels manageable",
        "Add complexity to movements as technique improves",
        "Gradually increase workout duration or decrease rest periods"
      ]
    },

    nutrition_recommendations: dietRecommendations,

    action_plan: {
      immediate: [
        "Schedule your workout days and times for the next week",
        `Stock your kitchen with ${dietType === 'vegetarian' ? 'plant-based proteins and vegetables' : (dietType === 'vegan' ? 'varied plant proteins and fortified foods' : 'lean proteins and fresh produce')}`,
        "Take baseline measurements and photos to track progress"
      ],

      short_term: [
        "Establish a consistent workout routine for 3-4 weeks",
        "Experiment with meal timing around your workouts",
        "Keep a simple log of workouts and how you feel afterward"
      ],

      long_term: [
        "Reassess your program every 4-6 weeks and make adjustments",
        "Gradually increase intensity and complexity as you progress",
        "Consider working with a professional for personalized guidance if plateauing"
      ]
    },

    health_considerations: {
      cautions: [
        hasJointIssues ? "Avoid high-impact activities that aggravate your joint issues" : "Stop any exercise that causes sharp or shooting pain",
        formData.healthConditions ? "Monitor how your health conditions respond to exercise and adjust accordingly" : "Begin gradually to avoid excessive soreness and potential injury"
      ],

      modifications: [
        hasJointIssues ? "Use exercise variations that reduce joint stress while working the same muscle groups" : "Start with regression exercises and progress to more advanced variations",
        hasMobility ? "Incorporate daily mobility work targeting your specific limitations" : "Use full range of motion in exercises to maintain and improve mobility"
      ]
    },

    personal_insights: [
      `Your preference for ${formData.preferredExercises || 'certain exercise types'} aligns well with your ${goalType.replace('-', ' ')} goal and can be leveraged for better consistency.`,

      experience === 'beginner'
        ? "As a beginner, your potential for improvement is at its highest point - you'll likely see rapid progress with consistent effort."
        : "Your experience level gives you an advantage in body awareness and technique, which will help you train more effectively.",

      formData.dislikedExercises
        ? `Your dislike of ${formData.dislikedExercises} is completely valid - there are many alternatives that can provide similar benefits while being more enjoyable.`
        : "Finding activities you enjoy is crucial for long-term adherence - be willing to experiment with different workout styles.",

      dietType !== 'general'
        ? `Your ${dietType} diet can absolutely support your fitness goals with proper planning and attention to key nutrients.`
        : "Nutrition fundamentals matter more than specific diet types - focus on whole foods, adequate protein, and proper hydration.",

      age > 40
        ? "Recovery becomes increasingly important as we age - prioritize sleep, stress management, and proper warm-ups."
        : "Consistency over intensity will yield better long-term results for most fitness goals."
    ]
  };
} 