'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Container 
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const GoalsPage = () => {
  const router = useRouter();
  
  // If someone directly navigates to /goals, show coming soon and redirect after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000); // 5 second delay before redirecting
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper 
        elevation={6}
        sx={{
          p: 4,
          borderRadius: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(37, 25, 84, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box 
          sx={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            bgcolor: 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            m: 'auto',
            mb: 3,
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <LockIcon sx={{ fontSize: 40, color: '#9c27b0' }} />
        </Box>
        
        <Typography variant="h4" component="h1" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
          Feature Removed
        </Typography>
        
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
          The Goals feature has been removed from this version of the application.
          Please check the fitness or mental health modules for dedicated coaching.
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/')}
          sx={{
            background: 'linear-gradient(to right, #9c27b0, #d500f9)',
            color: 'white',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'medium',
            '&:hover': {
              background: 'linear-gradient(to right, #8e24aa, #ce00e6)',
            }
          }}
        >
          Back to Home
        </Button>
        
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 3, fontSize: '0.75rem' }}>
          Redirecting you to the home page in a few seconds...
        </Typography>
      </Paper>
    </Container>
  );
};

export default GoalsPage;
