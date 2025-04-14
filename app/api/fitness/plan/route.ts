import { NextRequest, NextResponse } from 'next/server';
import { generateFitnessPlan } from '../../llm/service';

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
      const fitnessPlan = await generateFitnessPlan(formData);
      
      // Return the structured fitness plan
      return NextResponse.json({ plan: fitnessPlan });
    } catch (error) {
      console.error('Error generating fitness plan:', error);
      
      // Try again with the fallback function directly
      return NextResponse.json({ 
        plan: generateFitnessPlan(formData),
        warning: 'Used fallback plan due to API error'
      });
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