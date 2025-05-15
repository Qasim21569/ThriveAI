import { NextRequest, NextResponse } from 'next/server';

// Generate a fitness plan without any external API calls
function generateLocalPlan(formData: any) {
  console.log("Generating local plan without API...");
  
  // Extract key info from form data
  const {
    age, 
    gender, 
    height, 
    weight, 
    fitnessLevel, 
    fitnessGoals,
    healthConditions,
    dietaryRestrictions,
    injuries,
    preferredActivities,
    dislikedActivities
  } = formData;
  
  // Determine workout intensity
  let intensity = "moderate";
  if (fitnessLevel === "beginner") intensity = "light";
  if (fitnessLevel === "advanced") intensity = "challenging";
  
  // Check for injuries and health conditions
  const hasKneeIssues = injuries?.toLowerCase().includes("knee") || false;
  const hasBackIssues = injuries?.toLowerCase().includes("back") || false;
  const hasJointIssues = injuries?.toLowerCase().includes("joint") || false;
  const hasAsthma = healthConditions?.toLowerCase().includes("asthma") || false;
  const hasGutIssues = healthConditions?.toLowerCase().includes("gut") || false;
  
  // Personalize based on goals
  const isMuscleBuild = fitnessGoals?.includes("muscle") || fitnessGoals?.includes("strength") || false;
  const isWeightLoss = fitnessGoals?.includes("weight") || fitnessGoals?.includes("fat") || false;
  const isEndurance = fitnessGoals?.includes("endurance") || fitnessGoals?.includes("cardio") || false;
  
  // Customize workouts based on preferences
  let favoredExercises = [];
  if (preferredActivities?.toLowerCase().includes("push")) favoredExercises.push("Push-ups");
  if (preferredActivities?.toLowerCase().includes("pull")) favoredExercises.push("Pull-ups");
  if (preferredActivities?.toLowerCase().includes("squat")) favoredExercises.push("Squats");
  if (preferredActivities?.toLowerCase().includes("calv")) favoredExercises.push("Calf Raises");
  if (preferredActivities?.toLowerCase().includes("shoulder")) favoredExercises.push("Shoulder Press");
  if (preferredActivities?.toLowerCase().includes("back")) favoredExercises.push("Rows");
  
  // If no specific exercises mentioned, add some defaults
  if (favoredExercises.length === 0) {
    favoredExercises = ["Push-ups", "Body-weight Squats", "Dumbbell Rows"];
  }
  
  // Avoid exercises based on dislikes
  const avoidCycling = dislikedActivities?.toLowerCase().includes("cycl") || false;
  const avoidRunning = dislikedActivities?.toLowerCase().includes("run") || false;
  const avoidSwimming = dislikedActivities?.toLowerCase().includes("swim") || false;
  
  // Create diet based on goals and conditions
  let dietType = "Balanced";
  if (isMuscleBuild) dietType = "High-Protein";
  if (isWeightLoss) dietType = "Calorie-Deficit";
  if (hasGutIssues) dietType += " with Gut-Friendly Foods";
  
  // Dietary restrictions
  let restrictions = [];
  if (dietaryRestrictions && dietaryRestrictions !== "None specified") {
    restrictions.push(dietaryRestrictions);
  }
  
  // Add specific diet recommendations based on health conditions
  let recommendations = [
    "Maintain consistent meal timing",
    "Stay hydrated throughout the day"
  ];
  
  if (hasGutIssues) {
    recommendations.push("Focus on easily digestible foods");
    recommendations.push("Include probiotics in your diet");
  }
  
  if (hasAsthma) {
    recommendations.push("Include anti-inflammatory foods");
    recommendations.push("Monitor your breathing during workouts");
  }
  
  // Generate a personalized but local fitness plan
  return {
    diet: {
      meals: [
        {
          name: "Protein-Rich Breakfast",
          description: `${isMuscleBuild ? "High-protein" : "Balanced"} breakfast with eggs and whole grains`,
          time: "Morning"
        },
        {
          name: "Balanced Lunch",
          description: `${dietType} lunch with lean protein and vegetables`,
          time: "Midday"
        },
        {
          name: "Nutritious Dinner",
          description: `Light evening meal with ${hasGutIssues ? "easily digestible" : "diverse"} nutrients`,
          time: "Evening"
        }
      ],
      recommendations: recommendations,
      restrictions: restrictions.length > 0 ? restrictions : ["None specified"]
    },
    workouts: [
      {
        name: `${intensity.charAt(0).toUpperCase() + intensity.slice(1)} Strength Training`,
        description: `Full-body strength workout focusing on ${isMuscleBuild ? "muscle growth" : "overall fitness"}`,
        duration: "45 minutes",
        exercises: [
          {
            name: favoredExercises[0] || "Push-ups",
            sets: isMuscleBuild ? "4" : "3",
            reps: isMuscleBuild ? "8-10" : "10-12",
            notes: hasJointIssues ? "Perform with controlled motion to protect joints" : "Focus on proper form"
          },
          {
            name: favoredExercises[1] || "Squats",
            sets: isMuscleBuild ? "4" : "3",
            reps: isMuscleBuild ? "8-10" : "10-15",
            notes: hasKneeIssues ? "Use partial range of motion to avoid knee stress" : "Keep knees aligned with toes"
          },
          {
            name: "Plank",
            sets: "3",
            reps: "30-60 seconds",
            notes: hasBackIssues ? "Modified plank on knees if needed" : "Keep back straight and core engaged"
          }
        ]
      },
      {
        name: `${isEndurance ? "Endurance" : "Cardio"} Workout`,
        description: `${intensity} cardio session adapted to your fitness level`,
        duration: "30 minutes",
        exercises: [
          {
            name: avoidRunning ? "Brisk Walking" : "Interval Running",
            sets: "1",
            reps: "20 minutes",
            notes: hasKneeIssues ? "Low impact, focus on duration not speed" : "Alternate between high and low intensity"
          },
          {
            name: avoidCycling ? "Elliptical Trainer" : "Stationary Bike",
            sets: "1",
            reps: "10 minutes",
            notes: hasAsthma ? "Keep intensity moderate and monitor breathing" : "Maintain steady pace"
          }
        ]
      },
      {
        name: "Recovery & Flexibility",
        description: "Gentle stretching and mobility work",
        duration: "20 minutes",
        exercises: [
          {
            name: "Full Body Stretching",
            sets: "1",
            reps: "10 minutes",
            notes: "Hold each stretch for 20-30 seconds"
          },
          {
            name: "Foam Rolling",
            sets: "1",
            reps: "10 minutes",
            notes: hasBackIssues ? "Avoid rolling directly on lower back" : "Focus on tight muscle groups"
          }
        ]
      }
    ],
    goals: {
      short_term: [
        `Establish consistent ${isEndurance ? "cardio" : "training"} routine`,
        `Improve ${isMuscleBuild ? "strength" : isWeightLoss ? "diet habits" : "overall fitness"}`
      ],
      long_term: [
        isMuscleBuild ? "Increase muscle mass and strength" : 
          isWeightLoss ? "Achieve healthy weight and body composition" : 
          isEndurance ? "Build endurance and cardiovascular fitness" : 
          "Develop balanced fitness and wellness"
      ],
      metrics: {
        "weekly_workouts": formData.timeCommitment?.includes("5-6") ? "5-6" : "3-4",
        "daily_steps": "8,000-10,000",
        "water_intake": "2-3 liters",
        "recovery_days": hasJointIssues || hasBackIssues ? "2-3" : "1-2"
      }
    },
    weekly_routine: {
      monday: {
        workouts: [`${intensity.charAt(0).toUpperCase() + intensity.slice(1)} Strength Training`],
        nutrition: "Focus on protein intake",
        recovery: "Light stretching"
      },
      tuesday: {
        workouts: [`${isEndurance ? "Endurance" : "Cardio"} Workout`],
        nutrition: "Balanced macronutrients",
        recovery: "Foam rolling"
      },
      wednesday: {
        workouts: ["Recovery & Flexibility"],
        nutrition: "Anti-inflammatory foods",
        recovery: "Extra sleep"
      },
      thursday: {
        workouts: [`${intensity.charAt(0).toUpperCase() + intensity.slice(1)} Strength Training`],
        nutrition: "Focus on protein intake",
        recovery: "Light stretching"
      },
      friday: {
        workouts: [`${isEndurance ? "Endurance" : "Cardio"} Workout`],
        nutrition: "Balanced macronutrients",
        recovery: "Foam rolling"
      },
      saturday: {
        workouts: ["Recovery & Flexibility"],
        nutrition: "Light meals, focus on nutrition quality",
        recovery: "Full recovery day"
      },
      sunday: {
        workouts: ["Rest Day"],
        nutrition: "Moderate portions, focus on nutrition quality",
        recovery: "Complete rest"
      }
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body containing the form data
    const formData = await request.json();
    
    console.log('Local Fitness Plan API Request:', JSON.stringify(formData, null, 2));
    
    // Validate the request
    if (!formData) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing form data' }), 
        { status: 400 }
      );
    }
    
    // Generate a local plan without API calls
    console.log('Generating local fitness plan...');
    const localPlan = generateLocalPlan(formData);
    
    return NextResponse.json({ 
      plan: localPlan,
      source: 'local_generation'
    });
    
  } catch (error) {
    console.error('Error in local fitness plan API route:', error);
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