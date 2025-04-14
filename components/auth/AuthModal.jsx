'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  Box, 
  IconButton, 
  useTheme, 
  useMediaQuery,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SignIn from './SignIn';
import SignUp from './SignUp';

const AuthModal = ({ open = true, onClose, onSuccess, message }) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const toggleAuthMode = () => {
    setIsSignIn(!isSignIn);
  };
  
  const handleAuthSuccess = (user) => {
    // Call the success callback with the authenticated user
    if (onSuccess) {
      onSuccess(user);
    }
    // Close the modal
    if (onClose) {
      onClose();
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : '16px',
          width: fullScreen ? '100%' : '450px',
          maxWidth: '100%',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(37, 25, 84, 0.95) 100%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
      }}
    >
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'rgba(255, 255, 255, 0.7)',
          zIndex: 1,
          '&:hover': {
            color: 'white',
            background: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <CloseIcon />
      </IconButton>
      
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {message && (
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            borderRadius: '8px', 
            background: 'rgba(138, 92, 246, 0.15)',
            border: '1px solid rgba(138, 92, 246, 0.3)'
          }}>
            <Typography variant="body1" sx={{ color: 'white', textAlign: 'center' }}>
              {message}
            </Typography>
          </Box>
        )}

        <Box sx={{ pt: 2 }}>
          {isSignIn ? (
            <SignIn 
              onSuccess={handleAuthSuccess} 
              onSignUpClick={toggleAuthMode}
            />
          ) : (
            <SignUp 
              onSuccess={handleAuthSuccess} 
            />
          )}
          
          {!isSignIn && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Box 
                component="button" 
                onClick={toggleAuthMode}
                sx={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(138, 92, 246, 0.9)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 'medium',
                  p: 0,
                  '&:hover': {
                    color: 'rgba(138, 92, 246, 1)',
                    textDecoration: 'underline'
                  }
                }}
              >
                Already have an account? Sign In
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal; 