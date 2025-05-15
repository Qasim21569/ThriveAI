'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/firebaseConfig';
import { getUserSavedPlans, savePlanToUserProfile } from '@/lib/firebase/userService';
import { 
  Box,
  Typography,
  Button,
  Avatar,
  Paper,
  Divider, 
  Tab, 
  Tabs,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Container,
  CircularProgress,
  IconButton,
  useMediaQuery,
  useTheme,
  Alert
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';

// Interface for user's saved plans
interface SavedPlan {
  id?: string;
  type: string;
  title: string;
  description: string;
  date?: string;
  path: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interface for tab panels
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Component for tab panels
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [tabValue, setTabValue] = useState(0);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
  const [userData, setUserData] = useState({
    displayName: "User",
    email: "user@example.com",
    photoURL: null,
    emailVerified: true,
    creationTime: new Date().toISOString()
  });
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle back navigation
  const handleBack = () => {
    router.push('/');
  };

  // Handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Try to get Firebase user data without blocking page load
  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("User found:", user.displayName || user.email);
        setUserData({
          displayName: user.displayName || user.email?.split('@')[0] || "User",
          email: user.email || "No email available",
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          creationTime: user.metadata.creationTime || new Date().toISOString()
        });
        
        // Load user's plans from Firebase
        loadUserPlans(user.uid);
      } else {
        console.log("No user found, using default profile");
        setIsLoading(false);
        setIsPlansLoading(false);
        
        // Empty plans array for non-authenticated users
        setSavedPlans([]);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Load user plans from Firebase
  const loadUserPlans = async (userId: string) => {
    setIsPlansLoading(true);
    setError(null);
    
    try {
      console.log("Loading plans for user:", userId);
      
      // Get plans from Firebase
      const firebasePlans = await getUserSavedPlans(userId);
      console.log("Loaded plans from Firebase:", firebasePlans);
      
      if (firebasePlans && firebasePlans.length > 0) {
        setSavedPlans(firebasePlans);
      } else {
        // No plans yet, set empty array
        setSavedPlans([]);
      }
    } catch (err) {
      console.error("Error loading user plans:", err);
      setError("Failed to load your saved plans. Please try again later.");
      setSavedPlans([]);
    } finally {
      setIsLoading(false);
      setIsPlansLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'January 1, 2023';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'January 1, 2023';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #14143a, #0f0f29)',
      py: 6
    }}>
      {/* Back to Home Button */}
      <Box sx={{ position: 'absolute', top: { xs: 10, md: 20 }, left: { xs: 10, md: 20 }, zIndex: 20 }}>
        {isMobile ? (
          <IconButton
            onClick={handleBack}
            sx={{
              color: 'white',
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(20, 20, 58, 0.5)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              '&:hover': {
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        ) : (
          <Button
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'rgba(139, 92, 246, 0.4)',
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(20, 20, 58, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: 'rgba(139, 92, 246, 0.8)',
              }
            }}
          >
            Back to Home
          </Button>
        )}
      </Box>
      
      <Box sx={{ position: 'relative', zIndex: 10, py: 4, px: 2 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            textAlign: 'center', 
            mb: 4, 
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          Your <span style={{ 
            background: 'linear-gradient(to right, #8b5cf6, #6366f1)', 
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Profile
          </span>
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              maxWidth: 'lg', 
              mx: 'auto', 
              mb: 4,
              backgroundColor: 'rgba(211, 47, 47, 0.1)',
              color: 'white',
              borderColor: 'rgba(211, 47, 47, 0.2)' 
            }}
          >
            {error}
          </Alert>
        )}

        {/* Main Content */}
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {/* Sidebar */}
            <Grid item xs={12} md={4}>
          <Paper 
            elevation={3}
            sx={{ 
              bgcolor: 'rgba(20, 20, 58, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: 3,
                  overflow: 'hidden'
                }}
              >
                {/* User profile section */}
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  {isLoading ? (
                    <CircularProgress size={30} sx={{ color: '#8b5cf6' }} />
                  ) : (
                    <>
                      <Avatar 
                        src={userData.photoURL || undefined}
              sx={{ 
                          width: 80, 
                          height: 80, 
                          bgcolor: '#8b5cf6',
                          fontSize: '1.5rem',
                          mx: 'auto',
                          mb: 2
                        }}
                      >
                        {(userData.displayName?.charAt(0) || "U").toUpperCase()}
                      </Avatar>
                      
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                        {userData.displayName}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                        {userData.email}
                      </Typography>
                      
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                        Member since: {formatDate(userData.creationTime)}
                      </Typography>
                    </>
                  )}
                </Box>
                
                <Divider sx={{ borderColor: 'rgba(139, 92, 246, 0.2)' }} />
                
                {/* Navigation Tabs */}
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{ 
                    '.MuiTabs-indicator': { 
                      backgroundColor: '#8b5cf6',
                    }
                  }}
                >
                  <Tab 
                    icon={<PersonIcon />} 
                    label="Profile" 
                      sx={{ 
                      color: tabValue === 0 ? '#8b5cf6' : 'rgba(255,255,255,0.7)',
                      '&.Mui-selected': { color: '#8b5cf6' }
                    }} 
                  />
                  <Tab 
                    icon={<CalendarTodayIcon />} 
                    label="Plans" 
                        sx={{ 
                      color: tabValue === 1 ? '#8b5cf6' : 'rgba(255,255,255,0.7)',
                      '&.Mui-selected': { color: '#8b5cf6' }
                    }} 
                  />
                </Tabs>
              </Paper>
            </Grid>
            
            {/* Content Area */}
            <Grid item xs={12} md={8}>
              <Paper 
                elevation={3}
                sx={{ 
                  bgcolor: 'rgba(20, 20, 58, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  minHeight: '400px'
                }}
              >
                {isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <CircularProgress sx={{ color: '#8b5cf6' }} />
                  </Box>
                ) : (
                  <>
                    {/* Profile Info Tab Panel */}
                    <TabPanel value={tabValue} index={0}>
                      <Typography variant="h5" color="white" fontWeight="bold" sx={{ mb: 3 }}>
                        Profile Information
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Box sx={{ bgcolor: 'rgba(124, 58, 237, 0.1)', p: 2, borderRadius: 2 }}>
                            <Typography color="white" fontWeight="bold">Name</Typography>
                            <Typography color="rgba(255,255,255,0.7)">
                              {userData.displayName}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Box sx={{ bgcolor: 'rgba(124, 58, 237, 0.1)', p: 2, borderRadius: 2 }}>
                            <Typography color="white" fontWeight="bold">Email</Typography>
                            <Typography color="rgba(255,255,255,0.7)">
                              {userData.email}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Box sx={{ bgcolor: 'rgba(124, 58, 237, 0.1)', p: 2, borderRadius: 2 }}>
                            <Typography color="white" fontWeight="bold">Account Status</Typography>
                            <Typography color={userData.emailVerified ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'}>
                              {userData.emailVerified ? 'Verified' : 'Not verified'}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </TabPanel>
                    
                    {/* My Plans Tab Panel */}
                    <TabPanel value={tabValue} index={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" color="white" fontWeight="bold">
                          My Saved Plans
                        </Typography>
                      </Box>
                      
                      {isPlansLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                          <CircularProgress size={40} sx={{ color: 'rgba(139, 92, 246, 0.7)' }} />
                        </Box>
                      ) : savedPlans.length > 0 ? (
                        <Grid container spacing={3}>
                          {savedPlans.map((plan, index) => (
                            <Grid item xs={12} sm={6} key={plan.id || index}>
                              <Card 
                      sx={{ 
                                  backgroundColor: 'rgba(20, 20, 58, 0.9)',
                                  border: '1px solid rgba(139, 92, 246, 0.2)',
                                  borderRadius: 2,
                                  height: '100%',
                                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 20px rgba(139, 92, 246, 0.2)'
                                  }
                                }}
                              >
                                <CardActionArea 
                                  component={Link} 
                                  href={plan.path}
                                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                                >
                                  <CardContent sx={{ width: '100%' }}>
                                    <Typography variant="h6" color="white" fontWeight="bold" sx={{ mb: 1 }}>
                                      {plan.title}
                                    </Typography>
                                    
                                    <Typography color="rgba(255,255,255,0.7)" variant="body2" sx={{ mb: 2 }}>
                                      {plan.description}
                                    </Typography>
                                    
                                    <Typography color="rgba(255,255,255,0.5)" variant="caption">
                                      Created: {plan.date || formatDate(plan.createdAt)}
                                    </Typography>
                                  </CardContent>
                                </CardActionArea>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Box 
                      sx={{ 
                            textAlign: 'center', 
                            py: 6,
                        px: 3,
                            bgcolor: 'rgba(124, 58, 237, 0.05)',
                            borderRadius: 2,
                            border: '1px dashed rgba(139, 92, 246, 0.3)'
                          }}
                        >
                          <Typography color="rgba(255,255,255,0.7)" sx={{ mb: 2 }}>
                            You don't have any saved plans yet.
                          </Typography>
                    <Button 
                            onClick={() => router.push('/#modes')}
                      variant="outlined"
                            startIcon={<AddIcon />}
                      sx={{ 
                        borderColor: 'rgba(139, 92, 246, 0.5)',
                        color: 'rgba(255,255,255,0.9)',
                        '&:hover': {
                          borderColor: '#8b5cf6',
                                backgroundColor: 'rgba(139, 92, 246, 0.1)'
                        }
                      }}
                    >
                            Explore Coaching Modes
                    </Button>
                        </Box>
                      )}
                    </TabPanel>
                  </>
                )}
          </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Container>
  );
}
