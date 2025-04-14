"use client";

import { Box, Card, CardContent, Typography, CardMedia, Zoom } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useRouter } from 'next/navigation';

const modes = [
  {
    title: '🚀 Career Boosters',
    description: '✨ Wanna crush that next interview or land your dream job? We\'ve got your back with resume hacks, killer tips, and guidance to make your career take off.',
    image: '/images/career.png',
    icon: '🚀',
    path: '/career',
    color: '#3f51b5',
    bgGradient: 'linear-gradient(135deg, #3f51b5 0%, #7986cb 100%)'
  },
  {
    title: '💪 Fit & Fab Vibes',
    description: '🔥 Get your sweat on with custom workouts, nutrition hacks, and feel-good fitness tips. Whether you\'re aiming for beast mode or just wanna feel fab, we got you!',
    image: '/images/fitness.png',
    icon: '💪',
    path: '/fitness',
    color: '#4caf50',
    bgGradient: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)'
  },
  {
    title: '💡 Smart Finances',
    description: '📊 Take control of your money with expert tips on budgeting, saving, and investing. Build a secure and smarter financial future with confidence.',
    image: '/images/finance.png',
    icon: '💡',
    path: '/finance',
    color: '#ffc107',
    bgGradient: 'linear-gradient(135deg, #ffc107 0%, #ffecb3 100%)'
  },
  {
    title: '🌈 Mind Spa',
    description: '🧘‍♀️ Your chill zone for stress relief, mindfulness, and emotional wellness. Recharge, refocus, and feel lighter with expert-backed mental health tips.',
    image: '/images/mental.png',
    icon: '🌈',
    path: '/mental',
    color: '#9c27b0',
    bgGradient: 'linear-gradient(135deg, #9c27b0 0%, #ce93d8 100%)'
  },
];

const FeaturedModes = () => {
  const router = useRouter();

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: { xs: 4, md: 4 },
        width: '100%',
        maxWidth: '1200px',
        mx: 'auto'
      }}
    >
      {modes.map((mode, index) => (
        <Zoom
          in={true}
          style={{ transitionDelay: `${index * 150}ms` }}
          key={index}
        >
          <Box
            sx={{
              display: 'flex',
              height: '100%'
            }}
          >
            <Card
              elevation={0}
              sx={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 0.4s ease',
                position: 'relative',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-12px)',
                  boxShadow: '0 25px 35px rgba(0,0,0,0.15)',
                  '& .arrow-icon': {
                    transform: 'translateX(5px)',
                    opacity: 1,
                  },
                  '& .mode-image': {
                    transform: 'scale(1.08)',
                  },
                  '& .card-content': {
                    transform: 'translateY(-10px)',
                  }
                },
                boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
                border: 'none',
              }}
              onClick={() => handleCardClick(mode.path)}
            >
              <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  image={mode.image}
                  alt={mode.title}
                  className="mode-image"
                  sx={{
                    objectFit: 'cover',
                    width: '100%',
                    height: 200,
                    transition: 'transform 0.8s ease',
                    filter: 'brightness(0.9)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60%',
                    background: `linear-gradient(to top, ${mode.color}dd, transparent)`,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '50%',
                    width: 54,
                    height: 54,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  }}
                >
                  {mode.icon}
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    color: 'white',
                    fontWeight: 'bold',
                    textShadow: '0px 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {mode.title}
                </Typography>
              </Box>
              <CardContent
                className="card-content"
                sx={{
                  flexGrow: 1,
                  p: 3,
                  backgroundColor: 'white',
                  transition: 'all 0.4s ease',
                  pb: '20px !important'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: '40px',
                      height: '4px',
                      backgroundColor: mode.color,
                      borderRadius: '2px',
                    }}
                  />
                  <ArrowForwardIcon
                    className="arrow-icon"
                    sx={{
                      fontSize: '1.2rem',
                      opacity: 0.6,
                      transition: 'all 0.3s ease',
                      color: mode.color,
                    }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.7 }}
                >
                  {mode.description}
                </Typography>
              </CardContent>
              <Box
                sx={{
                  py: 1.5,
                  px: 3,
                  bgcolor: mode.color + '10',
                  color: mode.color,
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                {mode.title.includes('Career') ? '👉 Let\'s Level Up' : 
                 mode.title.includes('Fit') ? '🏋️‍♀️ Get Moving' :
                 mode.title.includes('Smart') ? '💰 Start Planning' : 
                 '🌿 Relax & Recharge'}
              </Box>
            </Card>
          </Box>
        </Zoom>
      ))}
    </Box>
  );
};

export default FeaturedModes;
