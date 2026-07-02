import { NextRequest, NextResponse } from 'next/server';
import { generateFitnessPlan } from './service';
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

    // Generate fitness plan
    const fitnessPlan = await generateFitnessPlan(formData);
    
    // Return the response
    return NextResponse.json({ plan: fitnessPlan });
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