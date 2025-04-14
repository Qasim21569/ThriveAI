import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Tabs, Tab, Paper, Divider } from '@mui/material';
import { useAuth } from '@/lib/firebase/authContext';
import GoalList from '@/components/goals/GoalList';
import GoalForm from '@/components/goals/GoalForm';
import { CoachingMode } from '@/app/api/llm/service';
import { User } from 'firebase/auth';

interface GoalTrackerProps {
  onClose?: () => void;
  selectedMode?: CoachingMode;
}

const GoalTracker: React.FC<GoalTrackerProps> = ({ onClose, selectedMode = 'general' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [goals, setGoals] = useState<any[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<CoachingMode>(selectedMode);
  const [activeTab, setActiveTab] = useState<string>('active');
  
  // Type guard to check if user is a valid Firebase User
  const isValidUser = (user: any): user is User => {
    return user !== null && typeof user === 'object' && 'uid' in user;
  };

  // Fetch goals when component mounts or when filters change
  useEffect(() => {
    if (user) {
      fetchGoals();
    } else {
      setLoading(false);
      setGoals([]);
    }
  }, [user, currentMode, activeTab]);
  
  // Define fetchGoals function outside useEffect to avoid lint warnings
  const fetchGoals = async () => {
    if (!isValidUser(user)) return;
    
    try {
      setLoading(true);
      // Since we've validated the user with isValidUser, we can safely use user.uid
      const userId = (user as User).uid;
      if (!userId) return;
      
      const response = await fetch(
        `/api/goals?userId=${userId}&mode=${currentMode}&status=${activeTab}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (goalData: any) => {
    if (!isValidUser(user)) return;
    
    try {
      // Since we've validated the user with isValidUser, we can safely use user.uid
      const userId = (user as User).uid;
      if (!userId) return;
      
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...goalData,
          mode: currentMode,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create goal');
      }
      
      setShowForm(false);
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleUpdateGoal = async (goalId: string, goalData: any) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalId,
          ...goalData,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update goal');
      }
      
      fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals?goalId=${goalId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }
      
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleAddProgress = async (goalId: string, progressData: any) => {
    try {
      const response = await fetch('/api/goals/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalId,
          ...progressData,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add progress');
      }
      
      fetchGoals();
    } catch (error) {
      console.error('Error adding progress:', error);
    }
  };

  const handleModeChange = (mode: CoachingMode) => {
    setCurrentMode(mode);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  if (!isValidUser(user)) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Please sign in to track your goals</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Goal Tracker
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Goal'}
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Mode selector */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Coaching Area:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(['career', 'fitness', 'finance', 'mental', 'general'] as CoachingMode[]).map((mode) => (
            <Button
              key={mode}
              variant={currentMode === mode ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleModeChange(mode)}
              sx={{ textTransform: 'capitalize' }}
            >
              {mode}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Status tabs */}
      <Box sx={{ mb: 2 }}>
        <Paper square>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Active" value="active" />
            <Tab label="Completed" value="completed" />
            <Tab label="Abandoned" value="abandoned" />
          </Tabs>
        </Paper>
      </Box>

      {/* Goal form */}
      {showForm && (
        <Box sx={{ mb: 3 }}>
          <GoalForm
            onSubmit={handleCreateGoal}
            onCancel={() => setShowForm(false)}
            mode={currentMode}
          />
        </Box>
      )}

      {/* Goals list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : goals.length > 0 ? (
        <GoalList
          goals={goals}
          onUpdateGoal={handleUpdateGoal}
          onDeleteGoal={handleDeleteGoal}
          onAddProgress={handleAddProgress}
        />
      ) : (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            {`No ${activeTab} goals found for ${currentMode} coaching. Click "Add New Goal" to create one.`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GoalTracker;
