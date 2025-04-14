'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  CircularProgress,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import { getUserProfile, saveUserProfile } from '@/lib/firebase/userProfile';
import ProfileForm from '@/components/ProfileForm';
import AuthModal from '@/components/auth/AuthModal';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Fetch user profile when authenticated
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      // Not logged in, show auth modal
      setShowAuthModal(true);
      return;
    }
    
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { success, data, error } = await getUserProfile(user.uid);
        if (success) {
          setProfileData(data);
        } else {
          // This is normal for new users, so don't log as error
          if (error === 'Profile not found') {
            console.log('No profile found for new user, creating empty profile');
          } else {
            console.error('Error fetching profile:', error);
          }
          // Create empty profile for new users
          setProfileData({});
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, loading]);
  
  const handleSaveProfile = async (formData) => {
    setError('');
    setSuccess('');
    setIsSaving(true);
    
    try {
      const { success, error } = await saveUserProfile(user.uid, formData);
      
      if (success) {
        setSuccess('Profile saved successfully!');
        setProfileData(formData);
      } else {
        setError(`Failed to save profile: ${error}`);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('An error occurred while saving your profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAuthSuccess = async (user) => {
    // After successful auth, try to get the user's profile
    try {
      const { success, data } = await getUserProfile(user.uid);
      if (success) {
        setProfileData(data);
      } else {
        // New user, empty profile
        setProfileData({});
      }
    } catch (err) {
      console.error('Error fetching profile after auth:', err);
      setProfileData({});
    }
    
    setShowAuthModal(false);
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <AuthModal 
        open={showAuthModal} 
        onClose={() => router.push('/')} 
        onAuthSuccess={handleAuthSuccess}
      />
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', mb: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="#3f51b5">
              Your Profile
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Customize your profile to get personalized coaching experiences across all domains.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" fontWeight="medium">
                Benefits of a complete profile:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  Personalized recommendations
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Tailored coaching advice
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Progress tracking
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Better goal setting
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={() => router.push('/')}
            sx={{ 
              py: 1.5, 
              borderColor: '#3f51b5', 
              color: '#3f51b5',
              borderRadius: '8px',
              '&:hover': {
                borderColor: '#303f9f',
                bgcolor: 'rgba(63, 81, 181, 0.04)'
              }
            }}
          >
            Back to Home
          </Button>
        </Grid>
        
        <Grid item xs={12} md={8}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
          
          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Loading your profile...
              </Typography>
            </Box>
          ) : (
            <ProfileForm 
              onSubmit={handleSaveProfile} 
              initialData={profileData || {}}
              isLoading={isSaving}
            />
          )}
        </Grid>
      </Grid>
    </Container>
  );
} 