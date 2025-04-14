import { NextRequest, NextResponse } from 'next/server';
import { generateFitnessPlan } from './service';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const formData = await request.json();
    
    console.log('Fitness Plan API Request:', JSON.stringify(formData, null, 2));
    
    // Generate fitness plan
    const fitnessPlan = await generateFitnessPlan(formData);
    
    // Return the response
    return NextResponse.json({ plan: fitnessPlan });
  } catch (error) {
    console.error('Error in fitness plan API route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An error occurred while generating your fitness plan' }), 
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