'use client';

import React from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';

interface ProgressEntry {
  value: number;
  notes?: string;
  date: Date;
}

interface ProgressChartProps {
  progressData: ProgressEntry[];
  initialValue: number;
  targetValue: number;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ 
  progressData, 
  initialValue, 
  targetValue 
}) => {
  if (!progressData || progressData.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No progress data available
        </Typography>
      </Box>
    );
  }

  // Sort data by date (newest first)
  const sortedData = [...progressData].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate current progress percentage
  const currentValue = sortedData[0].value;
  const progressPercentage = Math.min(100, Math.max(0, ((currentValue - initialValue) / (targetValue - initialValue)) * 100));
  
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Progress Overview
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2">
            Initial: {initialValue}
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            Current: {currentValue}
          </Typography>
          <Typography variant="body2">
            Target: {targetValue}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          sx={{ height: 10, borderRadius: 5 }}
        />
        <Typography variant="body2" align="right" sx={{ mt: 0.5 }}>
          {progressPercentage.toFixed(1)}% complete
        </Typography>
      </Box>
      
      <Typography variant="subtitle2" gutterBottom>
        Progress History
      </Typography>
      
      {sortedData.map((entry, index) => (
        <Paper 
          key={index} 
          elevation={1} 
          sx={{ 
            p: 1.5, 
            mb: 1, 
            borderLeft: '4px solid', 
            borderColor: index === 0 ? 'primary.main' : 'grey.300' 
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={index === 0 ? 'bold' : 'normal'}>
              {entry.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(entry.date).toLocaleDateString()}
            </Typography>
          </Box>
          {entry.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {entry.notes}
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default ProgressChart;
