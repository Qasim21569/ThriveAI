import { NextRequest, NextResponse } from 'next/server';
import { getAuthedUid } from '@/lib/auth/verifyAuth';
import { extractRequestSchema } from '@/lib/validation/api';
import { extractLifeModelDiff } from './service';

export async function POST(request: NextRequest) {
  const uid = await getAuthedUid(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = extractRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const diff = await extractLifeModelDiff(
      parsed.data.conversationText,
      JSON.stringify(parsed.data.lifeModel ?? {}),
    );
    return NextResponse.json({ diff });
  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json({ error: 'Failed to extract' }, { status: 500 });
  }
}
