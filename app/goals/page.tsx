'use client';

import React from 'react';
import GoalTracker from '@/components/GoalTracker';
import { Box, Container, Typography, Paper } from '@mui/material';

export default function GoalsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Goal Tracker
        </Typography>
        <Typography variant="body1" paragraph>
          Set, track, and achieve your personal development goals across all coaching domains.
          Monitor your progress over time and celebrate your achievements.
        </Typography>
      </Paper>
      
      <GoalTracker />
    </Container>
  );
}
