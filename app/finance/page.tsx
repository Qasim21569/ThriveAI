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

const FinancePage = () => {
  const router = useRouter();
  
  // If someone directly navigates to /finance, show coming soon and redirect after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/#modes');
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
            bgcolor: 'rgba(254, 197, 8, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            m: 'auto',
            mb: 3,
            border: '1px solid rgba(254, 197, 8, 0.3)',
          }}
        >
          <LockIcon sx={{ fontSize: 40, color: '#FFC107' }} />
        </Box>
        
        <Typography variant="h4" component="h1" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
          Coming Soon
        </Typography>
        
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
          The Finance Coaching mode is currently in development. 
          Please check back later for updates.
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/')}
          sx={{
            background: 'linear-gradient(to right, #e6a400, #ffd54f)',
            color: 'white',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'medium',
            '&:hover': {
              background: 'linear-gradient(to right, #d69600, #ffca28)',
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

export default FinancePage; 