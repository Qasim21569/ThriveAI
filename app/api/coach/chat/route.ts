import { NextRequest, NextResponse } from 'next/server';
import { getAuthedUid } from '@/lib/auth/verifyAuth';
import { coachChatRequestSchema } from '@/lib/validation/api';
import { streamCoachReply } from './service';

export async function POST(request: NextRequest) {
  const uid = await getAuthedUid(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = coachChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { message, planSummary, history } = parsed.data;

  try {
    const stream = await streamCoachReply(message, history ?? [], planSummary);
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Coach chat error:', error);
    return NextResponse.json({ error: 'Failed to generate a reply' }, { status: 500 });
  }
}
