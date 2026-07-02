import { NextRequest, NextResponse } from 'next/server';
import { getAuthedUid } from '@/lib/auth/verifyAuth';
import { summarizeRequestSchema } from '@/lib/validation/api';
import { summarizeCheckins } from './service';

export async function POST(request: NextRequest) {
  const uid = await getAuthedUid(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = summarizeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const summary = await summarizeCheckins(parsed.data.checkinsText);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarize error:', error);
    return NextResponse.json({ error: 'Failed to summarize' }, { status: 500 });
  }
}
