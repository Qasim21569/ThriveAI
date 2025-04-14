import { NextResponse } from 'next/server';

export async function GET() {
  // Redirect to the favicon in the public directory
  return NextResponse.redirect(new URL('/favicon.ico', 'http://localhost:3000'));
}

export const runtime = 'edge'; 