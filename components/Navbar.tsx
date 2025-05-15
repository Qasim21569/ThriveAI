"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppBar, Box, Button, Container, Drawer, Grid, IconButton, List, ListItem, Toolbar, Typography, Fade } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '@/lib/firebase/authContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseConfig';
import { User } from 'firebase/auth';

const menuItems = [
  { name: 'Home', path: '/' },
  { name: 'Features', path: '/#features' },
  { name: 'About', path: '/about' },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      setIsMobile(window.innerWidth < 960); // 960px is MUI's md breakpoint
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Helper function to get user's display name or email
  const getUserDisplayName = () => {
    const firebaseUser = user as User | null;
    if (firebaseUser) {
      if (firebaseUser.displayName) return firebaseUser.displayName;
      if (firebaseUser.email) return firebaseUser.email.split('@')[0]; // Use part before @ in email
      return 'User';
    }
    return '';
  };

  return (
    <Box
      component="nav"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backgroundColor: 'black',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.3s ease'
      }}
    >
      <Container maxWidth="lg">
        {/* Desktop view with grid layout for perfect centering */}
        {!isMobile && (
          <Grid container spacing={2} alignItems="center" sx={{ py: 2 }}>
            {/* Left section - Logo */}
            <Grid item xs={4}>
              <Fade in={true} timeout={1000}>
                <Box display="flex" alignItems="center">
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color="white"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        color: '#facc15',
                        cursor: 'pointer'
                      },
                      transition: 'color 0.2s ease'
                    }}
                  >
                    <span style={{ color: '#facc15' }}>Coach</span>AI
                  </Typography>
                </Box>
              </Fade>
            </Grid>

            {/* Middle section - Navigation links (always centered) */}
            <Grid item xs={4}>
              <Fade in={true} timeout={1000}>
                <Box
                  display="flex"
                  justifyContent="center"
                  gap={4}
                >
                  {menuItems.map((item, index) => (
                    <Link href={item.path} key={index} style={{ textDecoration: 'none' }}>
                      <Typography
                        variant="body1"
                        sx={{
                          cursor: 'pointer',
                          color: pathname === item.path ? '#facc15' : 'white',
                          position: 'relative',
                          padding: '5px 0',
                          fontWeight: 500,
                          '&:after': {
                            content: '""',
                            position: 'absolute',
                            width: pathname === item.path ? '100%' : '0%',
                            height: '2px',
                            bottom: 0,
                            left: 0,
                            backgroundColor: '#facc15',
                            transition: 'width 0.3s ease'
                          },
                          '&:hover': {
                            color: '#facc15',
                            '&:after': {
                              width: '100%'
                            }
                          },
                          transition: 'color 0.3s ease'
                        }}
                      >
                        {item.name}
                      </Typography>
                    </Link>
                  ))}
                </Box>
              </Fade>
            </Grid>

            {/* Right section - Auth controls */}
            <Grid item xs={4}>
              <Fade in={true} timeout={1000}>
                <Box display="flex" alignItems="center" justifyContent="flex-end" gap={2}>
                  {!loading && user ? (
                    // User is logged in - show welcome message and sign out button
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="body1" sx={{ color: 'white' }}>
                        Welcome, <span style={{ color: '#facc15', fontWeight: 'bold' }}>{getUserDisplayName()}</span>
                      </Typography>
                      <Link href="/profile" style={{ textDecoration: 'none' }}>
                        <Button
                          variant="outlined"
                          sx={{
                            color: 'white',
                            borderColor: 'rgba(255,255,255,0.3)',
                            borderRadius: '50px',
                            px: 3,
                            '&:hover': {
                              borderColor: '#facc15',
                              backgroundColor: 'rgba(250, 204, 21, 0.1)'
                            }
                          }}
                        >
                          Profile
                        </Button>
                      </Link>
                      <Button
                        variant="outlined"
                        onClick={handleSignOut}
                        sx={{
                          color: 'white',
                          borderColor: 'rgba(255,255,255,0.3)',
                          borderRadius: '50px',
                          px: 3,
                          '&:hover': {
                            borderColor: '#facc15',
                            backgroundColor: 'rgba(250, 204, 21, 0.1)'
                          }
                        }}
                      >
                        Sign Out
                      </Button>
                    </Box>
                  ) : !loading ? (
                    // User is not logged in - show login and signup buttons
                    <>
                      <Link href="/auth/sign-in" style={{ textDecoration: 'none' }}>
                        <Button
                          variant="outlined"
                          sx={{
                            color: 'white',
                            borderColor: 'rgba(255,255,255,0.3)',
                            borderRadius: '50px',
                            px: 3,
                            '&:hover': {
                              borderColor: '#facc15',
                              backgroundColor: 'rgba(250, 204, 21, 0.1)'
                            }
                          }}
                        >
                          Log in
                        </Button>
                      </Link>
                      <Link href="/auth/sign-up" style={{ textDecoration: 'none' }}>
                        <Button
                          variant="contained"
                          sx={{
                            bgcolor: '#facc15',
                            color: 'black',
                            borderRadius: '50px',
                            px: 3,
                            fontWeight: 'bold',
                            '&:hover': {
                              bgcolor: '#e6b800',
                              transform: 'scale(1.05)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Sign up
                        </Button>
                      </Link>
                    </>
                  ) : null}
                </Box>
              </Fade>
            </Grid>
          </Grid>
        )}

        {/* Mobile view */}
        {isMobile && (
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            py={2}
          >
            {/* Logo */}
            <Fade in={true} timeout={1000}>
              <Box display="flex" alignItems="center">
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color="white"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      color: '#facc15',
                      cursor: 'pointer'
                    },
                    transition: 'color 0.2s ease'
                  }}
                >
                  <span style={{ color: '#facc15' }}>Coach</span>AI
                </Typography>
              </Box>
            </Fade>

            {/* Mobile menu button */}
            <IconButton
              color="inherit"
              onClick={toggleMobileMenu}
              sx={{ color: 'white' }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}
      </Container>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
        sx={{
          '& .MuiDrawer-paper': {
            width: '70%',
            maxWidth: '300px',
            backgroundColor: 'black',
            color: 'white',
            padding: '20px'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <IconButton onClick={toggleMobileMenu} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" color="white" sx={{ mb: 3 }}>
            <span style={{ color: '#facc15' }}>Coach</span>AI
          </Typography>
        </Box>

        <List>
          {menuItems.map((item, index) => (
            <Link href={item.path} key={index} style={{ textDecoration: 'none', width: '100%' }}>
              <ListItem
                sx={{
                  py: 1.5,
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: pathname === item.path ? 'rgba(250, 204, 21, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.05)'
                  }
                }}
              >
                <Typography variant="body1" color={pathname === item.path ? '#facc15' : 'white'}>
                  {item.name}
                </Typography>
              </ListItem>
            </Link>
          ))}
        </List>

        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2, px: 2 }}>
          {!loading && user ? (
            // User is logged in - show welcome message and sign out button
            <>
              <Typography variant="body1" color="white" sx={{ textAlign: 'center', mb: 1 }}>
                Welcome, <span style={{ color: '#facc15', fontWeight: 'bold' }}>{getUserDisplayName()}</span>
              </Typography>
              <Link href="/profile" style={{ textDecoration: 'none', width: '100%' }}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      borderColor: '#facc15',
                      backgroundColor: 'rgba(250, 204, 21, 0.1)'
                    },
                    mb: 2
                  }}
                >
                  Profile
                </Button>
              </Link>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  handleSignOut();
                  toggleMobileMenu();
                }}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: '#facc15',
                    backgroundColor: 'rgba(250, 204, 21, 0.1)'
                  }
                }}
              >
                Sign Out
              </Button>
            </>
          ) : !loading ? (
            // User is not logged in - show login and signup buttons
            <>
              <Link href="/auth/sign-in" style={{ textDecoration: 'none', width: '100%' }}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      borderColor: '#facc15',
                      backgroundColor: 'rgba(250, 204, 21, 0.1)'
                    }
                  }}
                >
                  Log in
                </Button>
              </Link>
              <Link href="/auth/sign-up" style={{ textDecoration: 'none', width: '100%' }}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: '#facc15',
                    color: 'black',
                    fontWeight: 'bold',
                    '&:hover': {
                      bgcolor: '#e6b800'
                    }
                  }}
                >
                  Sign up
                </Button>
              </Link>
            </>
          ) : null}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Navbar;
