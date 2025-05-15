// Mental Wellbeing Assessment Service

// Types
interface MentalFormData {
  // User identity and emotional state
  userName?: string;
  currentEmotion?: string;
  emotionIntensity?: number;
  
  // Original fields
  sleepPattern: string;
  mealFrequency: string;
  caffeineIntake: string;
  smokingHabit: string;
  alcoholConsumption: string;
  dayToDay: string;
  emotionalExpression: string;
  emotionalComfort: string;
  anxietyLevel: string;
  physicalAnxiety: string;
  intrusiveThoughts: string;
  thoughtPatterns: string;
  familiarSettings: string;
  unfamiliarSettings: string;
  additionalInfo?: string;
  stressors: string;
  copingStrategies: string;
  
  // New fields
  reflections?: string;
  strengths?: string[];
}

interface MentalAssessment {
  // Personal greeting
  greeting?: string;
  
  // Original fields
  overview: {
    summary: string;
    strengths: string[];
    challenges: string[];
  };
  areas: {
    lifestyle: {
      score: string;
      summary: string;
      recommendations: string[];
    };
    emotional: {
      score: string;
      summary: string;
      recommendations: string[];
    };
    mental: {
      score: string;
      summary: string;
      recommendations: string[];
    };
    social: {
      score: string;
      summary: string;
      recommendations: string[];
    };
  };
  recommendations: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };
  resources: {
    practices: string[];
    support: string[];
  };
  
  // Added personal action plan
  action_plan: {
    today: string[];
    this_week: string[];
    this_month: string[];
    ongoing: string[];
  };
  
  // Added personal insights
  personal_insights: string[];
}

/**
 * Generate a mental wellbeing assessment using OpenRouter API
 */
export async function generateMentalAssessment(formData: MentalFormData): Promise<MentalAssessment> {
  try {
    console.log("Generating mental wellbeing assessment using OpenRouter...");
    console.log("Form data:", JSON.stringify(formData, null, 2));
    const prompt = createMentalAssessmentPrompt(formData);
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
    console.error("Error generating mental assessment:", error);
    return generateFallbackAssessment(formData);
  }
}

/**
 * Create a structured prompt for generating a mental assessment
 */
function createMentalAssessmentPrompt(formData: MentalFormData): string {
  const {
    // Extract new personal fields
    userName,
    currentEmotion,
    emotionIntensity,
    
    // Original fields
    sleepPattern,
    mealFrequency,
    caffeineIntake,
    smokingHabit,
    alcoholConsumption,
    dayToDay,
    emotionalExpression,
    emotionalComfort,
    anxietyLevel,
    physicalAnxiety,
    intrusiveThoughts,
    thoughtPatterns,
    familiarSettings,
    unfamiliarSettings,
    additionalInfo,
    stressors,
    copingStrategies,
    
    // New reflection fields
    reflections,
    strengths
  } = formData;

  return `Create a deeply personalized mental wellbeing assessment as JSON for someone with the following attributes:

PERSONAL INFORMATION:
- Name: ${userName || "The person"}
- Current Emotional State: ${currentEmotion || "Not specified"} (Intensity: ${emotionIntensity || "Not specified"})
- Personal Strengths: ${strengths ? strengths.join(", ") : "Not specified"}
 
LIFESTYLE & PHYSICAL HEALTH:
- Sleep Pattern: ${sleepPattern}
- Meal Frequency: ${mealFrequency}
- Caffeine Intake: ${caffeineIntake}
- Smoking Habit: ${smokingHabit}
- Alcohol Consumption: ${alcoholConsumption}
- Personal Reflections on Lifestyle: ${reflections || "Not provided"}

TEMPERAMENT & EMOTIONAL REGULATION:
- Day-to-day Temperament: ${dayToDay}
- Emotional Expression: ${emotionalExpression}
- Comfort with Difficult Emotions: ${emotionalComfort}

MENTAL HEALTH INDICATORS:
- Anxiety Level: ${anxietyLevel}
- Physical Anxiety Symptoms: ${physicalAnxiety}
- Intrusive Thoughts: ${intrusiveThoughts}
- General Thought Patterns: ${thoughtPatterns}

SOCIAL FUNCTIONING:
- Comfort in Familiar Settings: ${familiarSettings}
- Comfort in Unfamiliar Settings: ${unfamiliarSettings}

ADDITIONAL INFORMATION:
- Major Stressors: ${stressors}
- Coping Strategies: ${copingStrategies}
- Additional Context: ${additionalInfo || "None provided"}

Create a comprehensive mental wellbeing assessment that feels like it was written by a compassionate, insightful therapist who truly knows this person. Include:
1) A warm, personal greeting that acknowledges their current emotional state
2) An overview with a summary, strengths, and challenges
3) Assessment of key areas (lifestyle, emotional regulation, mental health, social functioning)
4) Personalized recommendations for immediate, short-term, and long-term actions
5) Helpful resources and practices
6) A concrete, actionable plan divided into today, this week, this month, and ongoing
7) 3-5 personal insights that help them understand their patterns in a new way

IMPORTANT:
- Use a warm, conversational tone as if speaking directly to ${userName || "the person"}
- Reference their specific answers and circumstances throughout
- Acknowledge their current emotional state (${currentEmotion || "unspecified"})
- Connect their lifestyle habits to their mental wellbeing
- Recognize their personal strengths and build on them
- Be empathetic and supportive in tone
- Provide actionable advice based on evidence-based practices
- DO NOT include any diagnostic language or medical advice
- Focus on self-care, coping strategies, and wellness approaches
- Make the assessment feel personally tailored, not generic

JSON structure:
{
  "greeting": "",
  "overview": {
    "summary": "",
    "strengths": ["","",""],
    "challenges": ["","",""]
  },
  "areas": {
    "lifestyle": {
      "score": "",
      "summary": "",
      "recommendations": ["","",""]
    },
    "emotional": {
      "score": "",
      "summary": "",
      "recommendations": ["","",""]
    },
    "mental": {
      "score": "",
      "summary": "",
      "recommendations": ["","",""]
    },
    "social": {
      "score": "",
      "summary": "",
      "recommendations": ["","",""]
    }
  },
  "recommendations": {
    "immediate": ["","",""],
    "short_term": ["","",""],
    "long_term": ["","",""]
  },
  "resources": {
    "practices": ["","",""],
    "support": ["","",""]
  },
  "action_plan": {
    "today": ["",""],
    "this_week": ["",""],
    "this_month": ["",""],
    "ongoing": ["",""]
  },
  "personal_insights": ["","","","",""]
}`;
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
function ensureValidAssessment(assessment: any): MentalAssessment {
  // Deep clone to avoid mutating the original
  const validAssessment = JSON.parse(JSON.stringify(assessment));
  
  // Ensure greeting exists
  if (!validAssessment.greeting) {
    validAssessment.greeting = "Thank you for completing this mental wellbeing assessment. I appreciate your openness and honesty.";
  }
  
  // Ensure overview exists
  if (!validAssessment.overview) {
    validAssessment.overview = {
      summary: "Based on your responses, we've created a personalized mental wellbeing assessment.",
      strengths: ["Self-awareness", "Seeking support"],
      challenges: ["Managing daily stressors"]
    };
  } else {
    // Ensure overview properties
    if (!validAssessment.overview.summary) {
      validAssessment.overview.summary = "Based on your responses, we've created a personalized mental wellbeing assessment.";
    }
    if (!validAssessment.overview.strengths || !Array.isArray(validAssessment.overview.strengths)) {
      validAssessment.overview.strengths = ["Self-awareness", "Seeking support"];
    }
    if (!validAssessment.overview.challenges || !Array.isArray(validAssessment.overview.challenges)) {
      validAssessment.overview.challenges = ["Managing daily stressors"];
    }
  }
  
  // Ensure areas exist
  if (!validAssessment.areas) {
    validAssessment.areas = {
      lifestyle: {
        score: "Moderate",
        summary: "Your lifestyle habits have room for improvement.",
        recommendations: ["Prioritize consistent sleep", "Establish regular meal times", "Monitor caffeine intake"]
      },
      emotional: {
        score: "Developing",
        summary: "You're working on emotional regulation skills.",
        recommendations: ["Practice naming emotions", "Try mindfulness techniques", "Journal about feelings"]
      },
      mental: {
        score: "Attention needed",
        summary: "Your mental wellbeing could use some extra support.",
        recommendations: ["Reduce sources of anxiety", "Establish a relaxation routine", "Practice positive self-talk"]
      },
      social: {
        score: "Moderate",
        summary: "Your social interactions provide some support but could be enhanced.",
        recommendations: ["Nurture close relationships", "Practice social skills in comfortable settings", "Gradually expand social circle"]
      }
    };
  } else {
    // Ensure each area exists with required properties
    const areas = ["lifestyle", "emotional", "mental", "social"];
    areas.forEach(area => {
      if (!validAssessment.areas[area]) {
        validAssessment.areas[area] = {
          score: "Moderate",
          summary: `Your ${area} wellbeing needs attention.`,
          recommendations: [`Improve ${area} habits`, `Seek support for ${area} challenges`]
        };
      } else {
        // Ensure area properties
        if (!validAssessment.areas[area].score) {
          validAssessment.areas[area].score = "Moderate";
        }
        if (!validAssessment.areas[area].summary) {
          validAssessment.areas[area].summary = `Your ${area} wellbeing needs attention.`;
        }
        if (!validAssessment.areas[area].recommendations || !Array.isArray(validAssessment.areas[area].recommendations)) {
          validAssessment.areas[area].recommendations = [`Improve ${area} habits`, `Seek support for ${area} challenges`];
        }
      }
    });
  }
  
  // Ensure recommendations exist
  if (!validAssessment.recommendations) {
    validAssessment.recommendations = {
      immediate: ["Take breaks throughout the day", "Practice deep breathing when stressed", "Get adequate sleep tonight"],
      short_term: ["Establish a regular sleep schedule", "Reduce caffeine intake", "Start a mindfulness practice"],
      long_term: ["Build a support network", "Develop emotional regulation skills", "Create healthy lifestyle habits"]
    };
  } else {
    // Ensure recommendation properties
    if (!validAssessment.recommendations.immediate || !Array.isArray(validAssessment.recommendations.immediate)) {
      validAssessment.recommendations.immediate = ["Take breaks throughout the day", "Practice deep breathing when stressed"];
    }
    if (!validAssessment.recommendations.short_term || !Array.isArray(validAssessment.recommendations.short_term)) {
      validAssessment.recommendations.short_term = ["Establish a regular sleep schedule", "Reduce caffeine intake"];
    }
    if (!validAssessment.recommendations.long_term || !Array.isArray(validAssessment.recommendations.long_term)) {
      validAssessment.recommendations.long_term = ["Build a support network", "Develop emotional regulation skills"];
    }
  }
  
  // Ensure resources exist
  if (!validAssessment.resources) {
    validAssessment.resources = {
      practices: ["Mindfulness meditation", "Progressive muscle relaxation", "Gratitude journaling"],
      support: ["Therapy or counseling", "Support groups", "Mental health apps and online resources"]
    };
  } else {
    // Ensure resources properties
    if (!validAssessment.resources.practices || !Array.isArray(validAssessment.resources.practices)) {
      validAssessment.resources.practices = ["Mindfulness meditation", "Progressive muscle relaxation", "Gratitude journaling"];
    }
    if (!validAssessment.resources.support || !Array.isArray(validAssessment.resources.support)) {
      validAssessment.resources.support = ["Therapy or counseling", "Support groups", "Mental health apps and online resources"];
    }
  }
  
  // Ensure action plan exists
  if (!validAssessment.action_plan) {
    validAssessment.action_plan = {
      today: ["Take 5 minutes for deep breathing", "Get to bed at a consistent time"],
      this_week: ["Schedule one enjoyable activity", "Try a 10-minute meditation"],
      this_month: ["Establish a regular self-care routine", "Connect with a supportive person"],
      ongoing: ["Practice mindfulness regularly", "Monitor your wellbeing patterns"]
    };
  } else {
    // Ensure action plan properties
    if (!validAssessment.action_plan.today || !Array.isArray(validAssessment.action_plan.today)) {
      validAssessment.action_plan.today = ["Take 5 minutes for deep breathing", "Get to bed at a consistent time"];
    }
    if (!validAssessment.action_plan.this_week || !Array.isArray(validAssessment.action_plan.this_week)) {
      validAssessment.action_plan.this_week = ["Schedule one enjoyable activity", "Try a 10-minute meditation"];
    }
    if (!validAssessment.action_plan.this_month || !Array.isArray(validAssessment.action_plan.this_month)) {
      validAssessment.action_plan.this_month = ["Establish a regular self-care routine", "Connect with a supportive person"];
    }
    if (!validAssessment.action_plan.ongoing || !Array.isArray(validAssessment.action_plan.ongoing)) {
      validAssessment.action_plan.ongoing = ["Practice mindfulness regularly", "Monitor your wellbeing patterns"];
    }
  }
  
  // Ensure personal insights exist
  if (!validAssessment.personal_insights || !Array.isArray(validAssessment.personal_insights)) {
    validAssessment.personal_insights = [
      "Your responses suggest a connection between your sleep patterns and emotional regulation.",
      "The way you approach social situations reflects your core values around connection.",
      "Your coping strategies show creativity and resilience, even when facing challenges."
    ];
  }
  
  return validAssessment as MentalAssessment;
}

/**
 * Generate a fallback assessment when the API fails
 */
function generateFallbackAssessment(formData: MentalFormData): MentalAssessment {
  console.log("Generating fallback mental assessment");
  
  // Extract basic info to personalize the fallback
  const userName = formData.userName || "there";
  const currentEmotion = formData.currentEmotion;
  const hasSleepIssues = formData.sleepPattern === 'poor' || formData.sleepPattern === 'inconsistent';
  const hasAnxiety = formData.anxietyLevel === 'moderate' || formData.anxietyLevel === 'severe';
  const hasSocialChallenges = formData.unfamiliarSettings === 'significant-anxiety' || formData.unfamiliarSettings === 'avoid';
  
  return {
    greeting: `Hi ${userName}, thank you for sharing your experiences with me${currentEmotion ? ` and letting me know you're feeling ${currentEmotion.toLowerCase()} right now` : ''}. I've created this personalized assessment based on your responses.`,
    
    overview: {
      summary: `Based on what you've shared, I can see several important patterns in your mental wellbeing. ${hasSleepIssues ? "Your sleep seems to be affecting your day-to-day experience. " : ""}${hasAnxiety ? "You're dealing with some significant anxiety that deserves attention and care. " : ""}Your openness to this assessment process shows a commitment to your wellbeing that's really valuable.`,
      
      strengths: [
        "Self-awareness and willingness to reflect on your mental wellbeing",
        formData.copingStrategies.includes("talk") || formData.copingStrategies.includes("friend") ? "Ability to reach out to others when needed" : "Recognition of your personal stressors and challenges",
        formData.copingStrategies ? `Your approach to coping through ${formData.copingStrategies.split(' ')[0].toLowerCase()}` : "Openness to developing new coping skills"
      ],
      
      challenges: [
        hasSleepIssues ? "Establishing consistent sleep patterns" : "Maintaining healthy lifestyle habits",
        hasAnxiety ? "Managing anxiety and worry" : "Balancing emotional responses to stress",
        hasSocialChallenges ? "Navigating social situations with confidence" : "Building deeper social connections"
      ]
    },
    
    areas: {
      lifestyle: {
        score: hasSleepIssues ? "Needs attention" : "Moderate",
        summary: hasSleepIssues 
          ? `Your sleep patterns and lifestyle habits could be contributing to stress and affecting your overall wellbeing. The ${formData.caffeineIntake} caffeine intake you mentioned might be playing a role.` 
          : `Your lifestyle habits provide a foundation for wellbeing, though there are opportunities for improvement. Your ${formData.mealFrequency} eating pattern may be supporting your energy levels.`,
        recommendations: [
          hasSleepIssues ? "Establish a consistent sleep schedule, even on weekends" : "Maintain your current sleep routine",
          "Create a calming bedtime ritual without screens",
          formData.caffeineIntake === 'moderate' || formData.caffeineIntake === 'heavy' ? "Reduce caffeine intake, especially after noon" : "Continue monitoring how beverages affect your energy and sleep"
        ]
      },
      emotional: {
        score: formData.emotionalComfort === 'very-uncomfortable' ? "Needs development" : "Moderate",
        summary: `Your ${formData.emotionalExpression.split('-')[0]} approach to emotional expression influences how you process and respond to situations. Developing greater comfort with emotions can enhance resilience.`,
        recommendations: [
          "Practice identifying and naming emotions as they arise",
          "Try mindfulness techniques to observe emotions without judgment",
          "Consider journaling to track emotional patterns"
        ]
      },
      mental: {
        score: hasAnxiety ? "Needs support" : "Developing",
        summary: hasAnxiety 
          ? `Your responses indicate significant anxiety that may be affecting your daily life and wellbeing. The ${formData.physicalAnxiety} physical symptoms you mentioned are common anxiety responses.` 
          : `You experience some mental health challenges that could benefit from supportive strategies. Your ${formData.thoughtPatterns} thought patterns show how you make sense of your experiences.`,
        recommendations: [
          hasAnxiety ? "Learn and practice relaxation techniques daily" : "Build a routine that includes stress management",
          "Challenge negative thought patterns with evidence-based approaches",
          "Consider professional support if symptoms persist or worsen"
        ]
      },
      social: {
        score: hasSocialChallenges ? "Challenging" : "Functional",
        summary: hasSocialChallenges 
          ? "Social situations appear to cause significant discomfort, which may be limiting your social connections." 
          : `Your social functioning provides some support, though there are opportunities to enhance connections. Being ${formData.familiarSettings.split('-')[0]} in familiar settings shows your capacity for connection.`,
        recommendations: [
          hasSocialChallenges ? "Start with small, comfortable social interactions" : "Nurture existing relationships",
          "Practice social skills in low-pressure environments",
          "Gradually expand your comfort zone in social settings"
        ]
      }
    },
    recommendations: {
      immediate: [
        "Practice 5 minutes of deep breathing when feeling overwhelmed",
        hasSleepIssues ? "Set a consistent bedtime tonight" : "Maintain your regular sleep schedule",
        hasAnxiety ? "When anxious, try the 5-4-3-2-1 grounding technique (notice 5 things you see, 4 things you feel, etc.)" : "Take regular breaks throughout your day"
      ],
      short_term: [
        hasAnxiety ? "Reduce caffeine and monitor its effects on your anxiety" : "Evaluate how your diet affects your mood and energy",
        "Establish a 10-minute daily mindfulness practice",
        hasSocialChallenges ? "Schedule one social interaction weekly in a comfortable setting" : "Deepen one existing relationship through regular connection"
      ],
      long_term: [
        "Develop a comprehensive self-care routine addressing physical, emotional, and mental needs",
        hasAnxiety ? "Consider working with a therapist to address anxiety patterns" : "Build a toolkit of stress management techniques",
        "Create meaningful social connections that provide mutual support"
      ]
    },
    resources: {
      practices: [
        "Mindfulness meditation (apps like Headspace, Calm, or Insight Timer)",
        "Progressive muscle relaxation for physical tension",
        hasAnxiety ? "Cognitive behavioral techniques for managing anxious thoughts" : "Journaling for emotional awareness and processing"
      ],
      support: [
        "Consider talking to a mental health professional for personalized guidance",
        "Explore support groups related to specific challenges",
        "Mental health apps and online resources like Psychology Today, NAMI, or Mental Health America"
      ]
    },
    action_plan: {
      today: [
        `Take 5 minutes to ${hasAnxiety ? "practice deep breathing when feeling anxious" : "reflect on a positive moment from today"}`,
        hasSleepIssues ? "Set a consistent bedtime tonight and create a relaxing pre-sleep routine" : "Notice how your body feels throughout the day"
      ],
      this_week: [
        hasAnxiety ? "Schedule one worry-free zone each day - a time when you intentionally focus on something enjoyable" : "Try a new self-care activity",
        "Reflect on one relationship that gives you energy and reach out to that person"
      ],
      this_month: [
        `Establish a regular ${hasSleepIssues ? "sleep routine" : "self-care practice"} that feels sustainable`,
        "Set a small, achievable goal related to your emotional wellbeing"
      ],
      ongoing: [
        "Continue to notice the connection between your physical habits and emotional state",
        "Practice self-compassion when facing challenges"
      ]
    },
    personal_insights: [
      hasSleepIssues ? "Your sleep patterns appear to be significantly influencing your emotional regulation capacity." : "Your lifestyle habits form a foundation that supports your mental wellbeing.",
      hasAnxiety ? "The physical symptoms you experience during anxiety are your body's natural response to stress. Recognizing them as such can help reduce their power." : "Your thought patterns show typical responses to stress, but don't appear to be overwhelming your coping capacity.",
      hasSocialChallenges ? "Your comfort in familiar vs. unfamiliar settings suggests you value deep connections over breadth of social contact." : "You appear to navigate social situations with relative ease, which is a significant resource for your wellbeing.",
      `The way you describe your ${formData.emotionalExpression.split('-')[0]} approach to emotional expression reflects your authentic self.`,
      "Your coping strategies show creativity and personal insight, even as you face challenges."
    ]
  };
} 