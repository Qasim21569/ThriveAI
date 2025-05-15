'use client';

import { useEffect, useState } from 'react';
import { Container, Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import { useAuth } from '@/lib/firebase/authContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseConfig';
import { useRouter } from 'next/navigation';

export default function AuthTestPage() {
  const { user, loading, error, authInitialized, authTime } = useAuth();
  const router = useRouter();
  const [refreshCount, setRefreshCount] = useState(0);

  // Force a re-render to check if auth state is stable
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshCount(prev => prev + 1);
    }, 2000);

    return () => clearTimeout(timer);
  }, [refreshCount]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Authentication Test Page
        </Typography>

        <Box sx={{ my: 3 }}>
          <Typography variant="h6">Status:</Typography>
          <Typography>
            Loading: {loading ? 'Yes' : 'No'} <br />
            User: {user ? `${user.email} (${user.uid})` : 'No user logged in'} <br />
            Error: {error ? error.message : 'None'} <br />
            Initialized: {authInitialized ? 'Yes' : 'No'} <br />
            Auth Time: {authTime} <br />
            Refresh Count: {refreshCount}
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          {user ? (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
              <Button
                variant="outlined"
                onClick={() => router.push('/profile')}
              >
                Go to Profile
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={() => router.push('/auth/sign-in')}
              >
                Sign In
              </Button>
              <Button
                variant="outlined"
                onClick={() => router.push('/auth/sign-up')}
              >
                Sign Up
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            onClick={() => router.push('/')}
          >
            Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 