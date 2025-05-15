import { NextRequest, NextResponse } from 'next/server';
import { generateMentalAssessment } from './service';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const formData = await request.json();
    
    console.log('Mental Wellbeing Assessment API Request:', JSON.stringify(formData, null, 2));
    console.log('OPENROUTER_API_KEY available:', !!process.env.OPENROUTER_API_KEY);
    console.log('OPENROUTER_MODEL:', process.env.OPENROUTER_MODEL || 'default not set');
    
    // Generate mental assessment
    const assessment = await generateMentalAssessment(formData);
    
    // Return the response
    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Error in mental assessment API route:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'An error occurred while generating your mental wellbeing assessment',
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