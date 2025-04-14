import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if we're accessing the API and if the token is set
  if (request.nextUrl.pathname.startsWith('/api/chat')) {
    // Check if the API token is set
    const token = process.env.HUGGING_FACE_API_TOKEN;
    
    if (!token || token === 'your_token_here') {
      return new NextResponse(
        JSON.stringify({
          error: 'Missing Hugging Face API token. Please set HUGGING_FACE_API_TOKEN in .env.local',
          setup_instructions: 'Get a token from https://huggingface.co/settings/tokens and add it to your .env.local file.'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }
  
  return NextResponse.next();
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: '/api/chat',
}; 