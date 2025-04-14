import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body - this will be the fitness form data
    const formData = await request.json();
    
    // Log the incoming request for debugging
    console.log('FORM SUBMISSION:', {
      formData: formData,
    });
    
    // Validate the request
    if (!formData) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing form data' }), 
        { status: 400 }
      );
    }
    
    // Simply return a success message
    return NextResponse.json({ 
      success: true,
      message: "Form data received successfully"
    });
    
  } catch (error) {
    console.error('Error handling form submission:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An error occurred while processing your submission' }), 
      { status: 500 }
    );
  }
} 