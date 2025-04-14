import { NextRequest, NextResponse } from 'next/server';
import { 
  createConversation, 
  getUserConversations, 
  getConversation, 
  updateConversation, 
  deleteConversation 
} from '@/lib/firebase/conversations';

// GET endpoint to fetch conversations for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const mode = searchParams.get('mode');
    const conversationId = searchParams.get('conversationId');

    if (!userId && !conversationId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required parameter: userId or conversationId' }), 
        { status: 400 }
      );
    }

    // If conversationId is provided, get a specific conversation
    if (conversationId) {
      const result = await getConversation(conversationId);
      
      if (!result.success) {
        return new NextResponse(
          JSON.stringify({ error: result.error }), 
          { status: 404 }
        );
      }
      
      return NextResponse.json(result);
    }
    
    // Otherwise, get all conversations for the user
    const result = await getUserConversations(userId, mode || null);
    
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({ error: result.error }), 
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in conversations API route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An error occurred while processing your request' }), 
      { status: 500 }
    );
  }
}

// POST endpoint to create a new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, mode, messages } = body;
    
    if (!userId || !mode) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields: userId or mode' }), 
        { status: 400 }
      );
    }
    
    const result = await createConversation(userId, mode, messages || []);
    
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({ error: result.error }), 
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in conversations API route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An error occurred while processing your request' }), 
      { status: 500 }
    );
  }
}

// PUT endpoint to update an existing conversation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, messages, title } = body;
    
    if (!conversationId || !messages) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields: conversationId or messages' }), 
        { status: 400 }
      );
    }
    
    const result = await updateConversation(conversationId, messages, title);
    
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({ error: result.error }), 
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in conversations API route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An error occurred while processing your request' }), 
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a conversation
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    
    if (!conversationId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required parameter: conversationId' }), 
        { status: 400 }
      );
    }
    
    const result = await deleteConversation(conversationId);
    
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({ error: result.error }), 
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in conversations API route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An error occurred while processing your request' }), 
      { status: 500 }
    );
  }
}

// OPTIONS endpoint for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
