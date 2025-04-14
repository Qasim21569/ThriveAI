import { NextRequest, NextResponse } from 'next/server';
import { addProgressUpdate, getGoalProgress, getGoalById } from '@/lib/firebase/goals';

// GET /api/goals/progress - Get progress history for a goal
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const goalId = searchParams.get('goalId');
    const userId = searchParams.get('userId');
    
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }
    
    // If userId is provided, verify that the goal belongs to the user
    if (userId) {
      const goal = await getGoalById(goalId);
      if (goal.userId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }
    
    const progress = await getGoalProgress(goalId);
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error in GET /api/goals/progress:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/goals/progress - Add a progress update to a goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goalId, value, notes } = body;
    
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }
    
    if (value === undefined) {
      return NextResponse.json({ error: 'Progress value is required' }, { status: 400 });
    }
    
    await addProgressUpdate(goalId, { value, notes });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/goals/progress:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
