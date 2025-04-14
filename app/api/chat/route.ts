import { NextRequest, NextResponse } from 'next/server';
import { generateLLMResponse, ChatRequest } from '../llm/service';
import { getUserProfile } from '@/lib/firebase/userProfile';

// Define a type for the user profile response
interface UserProfileResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json() as ChatRequest;
    
    // Log the incoming request for debugging
    console.log(`CHAT API REQUEST (${body.mode} mode):`, {
      userId: body.userId,
      message: body.messages[body.messages.length - 1]?.content,
      hasProfile: !!body.userProfile,
    });
    
    // Validate the request
    if (!body.messages || !body.mode) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields: messages or mode' }), 
        { status: 400 }
      );
    }
    
    // Use the profile data passed in the request if available
    let userProfileData = body.userProfile || null;
    
    // If not available in the request but we have a userId, try to fetch it
    if (!userProfileData && body.userId) {
      try {
        console.log(`Fetching profile for user ${body.userId} from database...`);
        const profileResponse = await getUserProfile(body.userId) as UserProfileResponse;
        if (profileResponse.success) {
          userProfileData = profileResponse.data;
          console.log('Successfully fetched user profile:', userProfileData);
        }
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Continue even if we can't get the profile
      }
    }
    
    // Prepare the request for the LLM service
    const llmRequest: ChatRequest = {
      messages: body.messages,
      profile: userProfileData,
      mode: body.mode
    };

    // Generate response from OpenRouter
    const responseText = await generateLLMResponse(llmRequest);
    console.log("Generated response:", responseText);
    
    // Return the response
    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Error in chat API route:', error);
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