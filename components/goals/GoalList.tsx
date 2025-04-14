'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Chip, 
  LinearProgress, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon
} from '@mui/icons-material';
import GoalForm from '@/components/goals/GoalForm';
import ProgressChart from '@/components/goals/ProgressChart';

interface Goal {
  id: string;
  title: string;
  description: string;
  mode: string;
  status: string;
  targetDate: Date | null;
  initialValue?: number;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  progress: ProgressEntry[];
  createdAt: Date;
  updatedAt: Date;
}

interface ProgressEntry {
  value: number;
  notes?: string;
  date: Date;
}

interface GoalListProps {
  goals: Goal[];
  onUpdateGoal: (goalId: string, goalData: any) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onAddProgress: (goalId: string, progressData: any) => Promise<void>;
}

const GoalList: React.FC<GoalListProps> = ({ 
  goals, 
  onUpdateGoal, 
  onDeleteGoal, 
  onAddProgress 
}) => {
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState<boolean>(false);
  const [currentGoalId, setCurrentGoalId] = useState<string>('');
  const [progressValue, setProgressValue] = useState<string>('');
  const [progressNotes, setProgressNotes] = useState<string>('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [goalToDelete, setGoalToDelete] = useState<string>('');

  const handleEditClick = (goal: Goal) => {
    setEditingGoal(goal);
  };

  const handleEditCancel = () => {
    setEditingGoal(null);
  };

  const handleEditSubmit = async (goalData: any) => {
    if (editingGoal) {
      await onUpdateGoal(editingGoal.id, goalData);
      setEditingGoal(null);
    }
  };

  const handleDeleteClick = (goalId: string) => {
    setGoalToDelete(goalId);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    await onDeleteGoal(goalToDelete);
    setConfirmDeleteOpen(false);
    setGoalToDelete('');
  };

  const handleStatusChange = async (goalId: string, newStatus: string) => {
    await onUpdateGoal(goalId, { status: newStatus });
  };

  const handleAddProgressClick = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal && goal.currentValue !== undefined) {
      setProgressValue(goal.currentValue.toString());
    } else {
      setProgressValue('');
    }
    setProgressNotes('');
    setCurrentGoalId(goalId);
    setProgressDialogOpen(true);
  };

  const handleProgressSubmit = async () => {
    const value = parseFloat(progressValue);
    if (!isNaN(value)) {
      await onAddProgress(currentGoalId, { value, notes: progressNotes });
      setProgressDialogOpen(false);
    }
  };

  const calculateProgress = (goal: Goal) => {
    if (goal.initialValue !== undefined && 
        goal.targetValue !== undefined && 
        goal.currentValue !== undefined) {
      const total = goal.targetValue - goal.initialValue;
      const current = goal.currentValue - goal.initialValue;
      return Math.min(100, Math.max(0, (current / total) * 100));
    }
    return 0;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'No date set';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Box>
      {goals.map((goal) => (
        <React.Fragment key={goal.id}>
          {editingGoal && editingGoal.id === goal.id ? (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <GoalForm
                  initialData={goal}
                  onSubmit={handleEditSubmit}
                  onCancel={handleEditCancel}
                  mode={goal.mode as any}
                  isEditing
                />
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {goal.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, mt: 0.5 }}>
                      <Chip 
                        label={goal.mode} 
                        size="small" 
                        color={
                          goal.mode === 'career' ? 'primary' :
                          goal.mode === 'fitness' ? 'success' :
                          goal.mode === 'finance' ? 'warning' :
                          goal.mode === 'mental' ? 'info' : 'default'
                        }
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Chip 
                        label={goal.status} 
                        size="small" 
                        color={
                          goal.status === 'active' ? 'success' :
                          goal.status === 'completed' ? 'info' : 'error'
                        }
                        sx={{ textTransform: 'capitalize' }}
                      />
                      {goal.targetDate && (
                        <Chip 
                          label={`Due: ${formatDate(goal.targetDate)}`} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditClick(goal)}
                      aria-label="Edit goal"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteClick(goal.id)}
                      aria-label="Delete goal"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {goal.description}
                </Typography>
                
                {/* Progress bar for measurable goals */}
                {goal.initialValue !== undefined && 
                 goal.targetValue !== undefined && 
                 goal.currentValue !== undefined && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        Current: {goal.currentValue} {goal.unit}
                      </Typography>
                      <Typography variant="body2">
                        Target: {goal.targetValue} {goal.unit}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={calculateProgress(goal)} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Box>
                    {goal.status === 'active' && (
                      <>
                        <Button
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleStatusChange(goal.id, 'completed')}
                          sx={{ mr: 1 }}
                        >
                          Mark Complete
                        </Button>
                        <Button
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={() => handleStatusChange(goal.id, 'abandoned')}
                        >
                          Abandon
                        </Button>
                      </>
                    )}
                    {goal.status !== 'active' && (
                      <Button
                        size="small"
                        onClick={() => handleStatusChange(goal.id, 'active')}
                      >
                        Reactivate
                      </Button>
                    )}
                  </Box>
                  
                  {goal.initialValue !== undefined && goal.targetValue !== undefined && (
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      variant="outlined"
                      onClick={() => handleAddProgressClick(goal.id)}
                    >
                      Add Progress
                    </Button>
                  )}
                </Box>
                
                {/* Progress history accordion */}
                {goal.progress && goal.progress.length > 0 && (
                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Progress History ({goal.progress.length} entries)</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {/* Progress chart */}
                      {goal.initialValue !== undefined && goal.targetValue !== undefined && (
                        <Box sx={{ height: 200, mb: 2 }}>
                          <ProgressChart 
                            progressData={goal.progress} 
                            initialValue={goal.initialValue}
                            targetValue={goal.targetValue}
                          />
                        </Box>
                      )}
                      
                      <Divider sx={{ mb: 2 }} />
                      
                      {/* Progress entries */}
                      {goal.progress.map((entry, index) => (
                        <Box key={index} sx={{ mb: 1, pb: 1, borderBottom: index < goal.progress.length - 1 ? '1px solid #eee' : 'none' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight="bold">
                              {entry.value} {goal.unit}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(entry.date).toLocaleString()}
                            </Typography>
                          </Box>
                          {entry.notes && (
                            <Typography variant="body2" color="text.secondary">
                              {entry.notes}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          )}
        </React.Fragment>
      ))}
      
      {/* Add Progress Dialog */}
      <Dialog open={progressDialogOpen} onClose={() => setProgressDialogOpen(false)}>
        <DialogTitle>Add Progress Update</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Current Value"
                type="number"
                fullWidth
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                InputProps={{
                  endAdornment: goals.find(g => g.id === currentGoalId)?.unit,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes (optional)"
                fullWidth
                multiline
                rows={3}
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleProgressSubmit} 
            variant="contained" 
            disabled={!progressValue || isNaN(parseFloat(progressValue))}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete Goal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this goal? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoalList;
