import { NextRequest, NextResponse } from 'next/server';
import { getAuthedUid } from '@/lib/auth/verifyAuth';
import { followupRequestSchema } from '@/lib/validation/api';
import { getFollowupQuestion } from './service';

export async function POST(request: NextRequest) {
  const uid = await getAuthedUid(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = followupRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const followup = await getFollowupQuestion(
      parsed.data.area,
      parsed.data.question,
      parsed.data.answer,
    );
    return NextResponse.json({ followup });
  } catch (error) {
    console.error('Followup error:', error);
    return NextResponse.json({ error: 'Failed to generate follow-up' }, { status: 500 });
  }
}
