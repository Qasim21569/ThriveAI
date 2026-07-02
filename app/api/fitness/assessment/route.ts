import { NextRequest, NextResponse } from 'next/server';
import { generateFitnessAssessment } from './service';
import { getAuthedUid } from '@/lib/auth/verifyAuth';
import { fitnessRequestSchema } from '@/lib/validation/api';

export async function POST(request: NextRequest) {
  try {
    // Reject unauthenticated requests
    const uid = await getAuthedUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate the request body shape
    const body = await request.json();
    const parsed = fitnessRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const formData = parsed.data;

    // Generate fitness assessment
    const assessment = await generateFitnessAssessment(formData);
    
    // Return the response
    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Error in fitness assessment API route:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'An error occurred while generating your fitness assessment',
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