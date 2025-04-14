import { NextRequest, NextResponse } from 'next/server';
import { generateLLMResponse } from './service';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    console.log('LLM API Request:', JSON.stringify(body, null, 2));
    
    // Validate the request
    if (!body.messages) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required field: messages' }), 
        { status: 400 }
      );
    }
    
    // Generate response from LLM
    const responseText = await generateLLMResponse({
      messages: body.messages,
      profile: body.profile || null,
      mode: body.mode || null
    });
    
    // Return the response
    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Error in LLM API route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An error occurred while processing your request' }), 
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