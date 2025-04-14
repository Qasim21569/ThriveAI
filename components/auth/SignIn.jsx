'use client';

import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  Link
} from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseConfig';

const SignIn = ({ onSuccess, onSignUpClick }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      // Call the success callback with the user
      if (onSuccess) {
        onSuccess(userCredential.user);
      }
      
    } catch (err) {
      let errorMessage = 'Failed to sign in';
      
      // Handle specific Firebase auth errors
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      }
      
      setError(errorMessage);
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: '16px' }}>
      <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" color="#3f51b5">
        Welcome Back
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Sign in to continue your coaching journey
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          required
          autoComplete="email"
        />
        
        <TextField
          fullWidth
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          margin="normal"
          required
          autoComplete="current-password"
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ 
            mt: 3, 
            mb: 2, 
            py: 1.5,
            bgcolor: '#3f51b5',
            '&:hover': {
              bgcolor: '#303f9f'
            },
            borderRadius: '8px'
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>
        
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" component="span">
            Don&apos;t have an account?{' '}
          </Typography>
          <Link 
            component="button" 
            variant="body2" 
            onClick={onSignUpClick}
            sx={{ 
              fontWeight: 'medium',
              color: '#3f51b5',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Sign Up
          </Link>
        </Box>
      </Box>
    </Paper>
  );
};

export default SignIn; 