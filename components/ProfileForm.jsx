'use client';

import { useState } from 'react';
import { 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box, 
  Typography, 
  Chip, 
  Grid, 
  Paper,
  Divider,
  TextareaAutosize
} from '@mui/material';

const ProfileForm = ({ onSubmit, initialData = {}, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    age: initialData.age || '',
    occupation: initialData.occupation || '',
    experience: initialData.experience || '',
    interests: initialData.interests || [],
    goals: initialData.goals || [],
    fitnessLevel: initialData.fitnessLevel || 'beginner',
    healthConditions: initialData.healthConditions || [],
    financialGoals: initialData.financialGoals || [],
    budget: initialData.budget || '',
    careerStage: initialData.careerStage || 'early',
    mentalHealthNeeds: initialData.mentalHealthNeeds || [],
    ...initialData
  });

  const [interestInput, setInterestInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [healthConditionInput, setHealthConditionInput] = useState('');
  const [financialGoalInput, setFinancialGoalInput] = useState('');
  const [mentalHealthInput, setMentalHealthInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle chip additions
  const handleAddInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        interests: [...prev.interests, interestInput.trim()]
      }));
      setInterestInput('');
    }
  };

  const handleAddGoal = () => {
    if (goalInput.trim() && !formData.goals.includes(goalInput.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        goals: [...prev.goals, goalInput.trim()]
      }));
      setGoalInput('');
    }
  };

  const handleAddHealthCondition = () => {
    if (healthConditionInput.trim() && !formData.healthConditions.includes(healthConditionInput.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        healthConditions: [...prev.healthConditions, healthConditionInput.trim()]
      }));
      setHealthConditionInput('');
    }
  };

  const handleAddFinancialGoal = () => {
    if (financialGoalInput.trim() && !formData.financialGoals.includes(financialGoalInput.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        financialGoals: [...prev.financialGoals, financialGoalInput.trim()]
      }));
      setFinancialGoalInput('');
    }
  };

  const handleAddMentalHealthNeed = () => {
    if (mentalHealthInput.trim() && !formData.mentalHealthNeeds.includes(mentalHealthInput.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        mentalHealthNeeds: [...prev.mentalHealthNeeds, mentalHealthInput.trim()]
      }));
      setMentalHealthInput('');
    }
  };

  // Handle chip deletions
  const handleDeleteInterest = (itemToDelete) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(item => item !== itemToDelete)
    }));
  };

  const handleDeleteGoal = (itemToDelete) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter(item => item !== itemToDelete)
    }));
  };

  const handleDeleteHealthCondition = (itemToDelete) => {
    setFormData(prev => ({
      ...prev,
      healthConditions: prev.healthConditions.filter(item => item !== itemToDelete)
    }));
  };

  const handleDeleteFinancialGoal = (itemToDelete) => {
    setFormData(prev => ({
      ...prev,
      financialGoals: prev.financialGoals.filter(item => item !== itemToDelete)
    }));
  };

  const handleDeleteMentalHealthNeed = (itemToDelete) => {
    setFormData(prev => ({
      ...prev,
      mentalHealthNeeds: prev.mentalHealthNeeds.filter(item => item !== itemToDelete)
    }));
  };

  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" gutterBottom fontWeight="bold" color="#3f51b5">
          Your Profile Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          The more information you provide, the more personalized your coaching experience will be.
        </Typography>
        
        <Grid container spacing={3}>
          {/* Personal Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 1, color: '#3f51b5' }}>
              Personal Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Career Stage</InputLabel>
              <Select
                name="careerStage"
                value={formData.careerStage}
                label="Career Stage"
                onChange={handleChange}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="early">Early Career</MenuItem>
                <MenuItem value="mid">Mid Career</MenuItem>
                <MenuItem value="senior">Senior Level</MenuItem>
                <MenuItem value="executive">Executive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Professional Experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              multiline
              rows={2}
              variant="outlined"
              placeholder="Brief summary of your professional experience"
            />
          </Grid>
          
          {/* General Goals Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: '#3f51b5' }}>
              General Goals & Interests
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          {/* Goals */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Life Goals
            </Typography>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <TextField
                fullWidth
                label="Add a goal"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                variant="outlined"
                size="small"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGoal();
                  }
                }}
              />
              <Button 
                onClick={handleAddGoal}
                variant="contained"
                sx={{ ml: 1, bgcolor: '#3f51b5' }}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.goals.map((goal, index) => (
                <Chip
                  key={index}
                  label={goal}
                  onDelete={() => handleDeleteGoal(goal)}
                  sx={{ bgcolor: 'rgba(63, 81, 181, 0.1)', color: '#3f51b5' }}
                />
              ))}
            </Box>
          </Grid>
          
          {/* Interests & Hobbies */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium" sx={{ mt: 2 }}>
              Interests & Hobbies
            </Typography>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <TextField
                fullWidth
                label="Add an interest"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                variant="outlined"
                size="small"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
              />
              <Button 
                onClick={handleAddInterest}
                variant="contained"
                sx={{ ml: 1, bgcolor: '#3f51b5' }}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.interests.map((interest, index) => (
                <Chip
                  key={index}
                  label={interest}
                  onDelete={() => handleDeleteInterest(interest)}
                  sx={{ bgcolor: 'rgba(63, 81, 181, 0.1)', color: '#3f51b5' }}
                />
              ))}
            </Box>
          </Grid>
          
          {/* Fitness & Health Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: '#4caf50' }}>
              Fitness & Health
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Fitness Level</InputLabel>
              <Select
                name="fitnessLevel"
                value={formData.fitnessLevel}
                label="Fitness Level"
                onChange={handleChange}
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
                <MenuItem value="athlete">Athlete</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Health Conditions */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium" sx={{ mt: 2 }}>
              Health Considerations
            </Typography>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <TextField
                fullWidth
                label="Add health conditions or considerations"
                value={healthConditionInput}
                onChange={(e) => setHealthConditionInput(e.target.value)}
                variant="outlined"
                size="small"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddHealthCondition();
                  }
                }}
              />
              <Button 
                onClick={handleAddHealthCondition}
                variant="contained"
                sx={{ ml: 1, bgcolor: '#4caf50' }}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.healthConditions.map((condition, index) => (
                <Chip
                  key={index}
                  label={condition}
                  onDelete={() => handleDeleteHealthCondition(condition)}
                  sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}
                />
              ))}
            </Box>
          </Grid>
          
          {/* Financial Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: '#ffc107' }}>
              Financial Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Monthly Budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              variant="outlined"
              placeholder="e.g., $3000 or Low/Medium/High"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium" sx={{ mt: 2 }}>
              Financial Goals
            </Typography>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <TextField
                fullWidth
                label="Add a financial goal"
                value={financialGoalInput}
                onChange={(e) => setFinancialGoalInput(e.target.value)}
                variant="outlined"
                size="small"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFinancialGoal();
                  }
                }}
              />
              <Button 
                onClick={handleAddFinancialGoal}
                variant="contained"
                sx={{ ml: 1, bgcolor: '#ffc107', color: 'rgba(0,0,0,0.7)' }}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.financialGoals.map((goal, index) => (
                <Chip
                  key={index}
                  label={goal}
                  onDelete={() => handleDeleteFinancialGoal(goal)}
                  sx={{ bgcolor: 'rgba(255, 193, 7, 0.1)', color: '#ffc107' }}
                />
              ))}
            </Box>
          </Grid>
          
          {/* Mental Health Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: '#9c27b0' }}>
              Mental Wellbeing
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Mental Health Needs
            </Typography>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <TextField
                fullWidth
                label="Add mental health needs or focus areas"
                value={mentalHealthInput}
                onChange={(e) => setMentalHealthInput(e.target.value)}
                variant="outlined"
                size="small"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMentalHealthNeed();
                  }
                }}
              />
              <Button 
                onClick={handleAddMentalHealthNeed}
                variant="contained"
                sx={{ ml: 1, bgcolor: '#9c27b0' }}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.mentalHealthNeeds.map((need, index) => (
                <Chip
                  key={index}
                  label={need}
                  onDelete={() => handleDeleteMentalHealthNeed(need)}
                  sx={{ bgcolor: 'rgba(156, 39, 176, 0.1)', color: '#9c27b0' }}
                />
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth
              disabled={isLoading}
              sx={{ 
                mt: 4, 
                bgcolor: '#3f51b5',
                py: 1.5,
                borderRadius: '8px',
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: '#303f9f'
                }
              }}
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProfileForm; 