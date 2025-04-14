import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Grid, 
  FormControlLabel, 
  Checkbox,
  Typography,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
// Removed date picker imports to avoid compatibility issues
import { CoachingMode } from '@/app/api/llm/service';

interface GoalFormProps {
  onSubmit: (goalData: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
  mode: CoachingMode;
  isEditing?: boolean;
}

const GoalForm: React.FC<GoalFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData, 
  mode,
  isEditing = false
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [targetDate, setTargetDate] = useState<Date | null>(
    initialData?.targetDate ? new Date(initialData.targetDate) : null
  );
  const [isMeasurable, setIsMeasurable] = useState(
    initialData?.initialValue !== undefined && initialData?.targetValue !== undefined
  );
  const [initialValue, setInitialValue] = useState(
    initialData?.initialValue !== undefined ? initialData.initialValue.toString() : '0'
  );
  const [currentValue, setCurrentValue] = useState(
    initialData?.currentValue !== undefined ? initialData.currentValue.toString() : 
    initialData?.initialValue !== undefined ? initialData.initialValue.toString() : '0'
  );
  const [targetValue, setTargetValue] = useState(
    initialData?.targetValue !== undefined ? initialData.targetValue.toString() : '100'
  );
  const [unit, setUnit] = useState(initialData?.unit || '');
  
  // Get suggested goals based on coaching mode
  const getSuggestedGoals = () => {
    switch (mode) {
      case 'career':
        return [
          'Apply to 5 jobs this month',
          'Update my resume and LinkedIn profile',
          'Network with 3 professionals in my field',
          'Complete a certification in my industry',
          'Improve my interview skills'
        ];
      case 'fitness':
        return [
          'Exercise 3 times per week',
          'Run 5 kilometers without stopping',
          'Lose 5 kilograms',
          'Drink 2 liters of water daily',
          'Sleep 8 hours every night'
        ];
      case 'finance':
        return [
          'Save $1000 in my emergency fund',
          'Reduce monthly expenses by 10%',
          'Pay off credit card debt',
          'Create and follow a monthly budget',
          'Invest 10% of my income'
        ];
      case 'mental':
        return [
          'Meditate for 10 minutes daily',
          'Journal 3 times per week',
          'Read one self-improvement book monthly',
          'Practice gratitude daily',
          'Reduce screen time by 1 hour per day'
        ];
      default:
        return [
          'Complete a personal project',
          'Learn a new skill',
          'Establish a healthy habit',
          'Improve work-life balance',
          'Connect with friends and family regularly'
        ];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalData: any = {
      title,
      description,
      targetDate,
    };
    
    if (isMeasurable) {
      goalData.initialValue = parseFloat(initialValue);
      goalData.targetValue = parseFloat(targetValue);
      goalData.unit = unit;
      
      // Only set currentValue if this is a new goal or if it's explicitly changed
      if (!isEditing || (initialData?.currentValue !== parseFloat(currentValue))) {
        goalData.currentValue = parseFloat(currentValue);
      }
    }
    
    await onSubmit(goalData);
  };

  const handleSuggestedGoalClick = (goal: string) => {
    setTitle(goal);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {isEditing ? 'Edit Goal' : 'Create New Goal'}
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Goal Title"
              fullWidth
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Grid>
          
          {!isEditing && title.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Suggested Goals:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {getSuggestedGoals().map((goal, index) => (
                  <Button 
                    key={index} 
                    size="small" 
                    variant="outlined"
                    onClick={() => handleSuggestedGoalClick(goal)}
                  >
                    {goal}
                  </Button>
                ))}
              </Box>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Target Date (Optional)"
              type="date"
              fullWidth
              value={targetDate ? targetDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const dateValue = e.target.value;
                setTargetDate(dateValue ? new Date(dateValue) : null);
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isMeasurable}
                  onChange={(e) => setIsMeasurable(e.target.checked)}
                />
              }
              label="This goal is measurable (has numeric targets)"
            />
          </Grid>
          
          {isMeasurable && (
            <>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Initial Value"
                  type="number"
                  fullWidth
                  value={initialValue}
                  onChange={(e) => {
                    setInitialValue(e.target.value);
                    // Update current value if it's equal to the previous initial value
                    if (currentValue === initialValue) {
                      setCurrentValue(e.target.value);
                    }
                  }}
                  InputProps={{
                    endAdornment: unit ? <InputAdornment position="end">{unit}</InputAdornment> : null,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Current Value"
                  type="number"
                  fullWidth
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  InputProps={{
                    endAdornment: unit ? <InputAdornment position="end">{unit}</InputAdornment> : null,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Target Value"
                  type="number"
                  fullWidth
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  InputProps={{
                    endAdornment: unit ? <InputAdornment position="end">{unit}</InputAdornment> : null,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="unit-label">Unit of Measurement</InputLabel>
                  <Select
                    labelId="unit-label"
                    value={unit}
                    label="Unit of Measurement"
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="kg">Kilograms (kg)</MenuItem>
                    <MenuItem value="lbs">Pounds (lbs)</MenuItem>
                    <MenuItem value="km">Kilometers (km)</MenuItem>
                    <MenuItem value="mi">Miles (mi)</MenuItem>
                    <MenuItem value="min">Minutes (min)</MenuItem>
                    <MenuItem value="hrs">Hours (hrs)</MenuItem>
                    <MenuItem value="%">Percentage (%)</MenuItem>
                    <MenuItem value="$">Dollars ($)</MenuItem>
                    <MenuItem value="€">Euros (€)</MenuItem>
                    <MenuItem value="steps">Steps</MenuItem>
                    <MenuItem value="times">Times</MenuItem>
                    <MenuItem value="days">Days</MenuItem>
                    <MenuItem value="weeks">Weeks</MenuItem>
                    <MenuItem value="points">Points</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={!title}
            >
              {isEditing ? 'Update Goal' : 'Create Goal'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default GoalForm;
