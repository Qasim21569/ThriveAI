import { NextRequest, NextResponse } from 'next/server';
import { 
  createGoal, 
  getUserGoals, 
  getGoalById, 
  updateGoal, 
  deleteGoal, 
  addProgressUpdate, 
  getGoalProgress 
} from '@/lib/firebase/goals';

// GET /api/goals - Get all goals for a user
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const mode = searchParams.get('mode');
    const status = searchParams.get('status');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // If goalId is provided, get a specific goal
    const goalId = searchParams.get('goalId');
    if (goalId) {
      const goal = await getGoalById(goalId);
      
      // Check if the goal belongs to the user
      if (goal.userId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      return NextResponse.json(goal);
    }
    
    // Otherwise, get all goals for the user
    const goals = await getUserGoals(userId, mode || null, status || null);
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error in GET /api/goals:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...goalData } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Validate required fields
    if (!goalData.title || !goalData.mode) {
      return NextResponse.json(
        { error: 'Title and mode are required fields' },
        { status: 400 }
      );
    }
    
    // Convert targetDate string to Date object if provided
    if (goalData.targetDate && typeof goalData.targetDate === 'string') {
      goalData.targetDate = new Date(goalData.targetDate);
    }
    
    const goalId = await createGoal(userId, goalData);
    return NextResponse.json({ id: goalId, success: true });
  } catch (error) {
    console.error('Error in POST /api/goals:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}

// PUT /api/goals - Update a goal
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { goalId, ...goalData } = body;
    
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }
    
    // Convert targetDate string to Date object if provided
    if (goalData.targetDate && typeof goalData.targetDate === 'string') {
      goalData.targetDate = new Date(goalData.targetDate);
    }
    
    await updateGoal(goalId, goalData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/goals:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals - Delete a goal
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const goalId = searchParams.get('goalId');
    
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }
    
    await deleteGoal(goalId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/goals:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
