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
  Divider,
  Switch,
  FormControlLabel,
  FormGroup,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import AuthModal from '@/components/auth/AuthModal';
import {
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [value, setValue] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      newsletter: true
    },
    appearance: {
      darkMode: true,
      animations: true,
      highContrast: false
    },
    privacy: {
      shareData: true,
      allowAnalytics: true,
      showProfile: true
    }
  });

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not logged in, show auth modal
      setShowAuthModal(true);
      return;
    }

    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // Load settings from localStorage instead of userProfile
        const savedSettings = localStorage.getItem(`settings_${user.uid}`);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        } else {
          // Keep default settings if user doesn't have any
          console.log('Using default settings (no saved settings found)');
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user, loading]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleSettingChange = (category, setting) => (event) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: event.target.checked
      }
    });
  };

  const saveSettings = async () => {
    if (!user) return;

    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      // Save settings to localStorage instead of userProfile
      localStorage.setItem(`settings_${user.uid}`, JSON.stringify(settings));
      setSuccess('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('An error occurred while saving your settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  if (loading || isLoading) {
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

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton
          onClick={() => router.push('/')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Settings
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleTabChange}
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<NotificationsIcon />}
              label="Notifications"
              {...a11yProps(0)}
              sx={{
                minHeight: '72px',
                '&.Mui-selected': { color: '#facc15' }
              }}
            />
            <Tab
              icon={<PaletteIcon />}
              label="Appearance"
              {...a11yProps(1)}
              sx={{
                minHeight: '72px',
                '&.Mui-selected': { color: '#facc15' }
              }}
            />
            <Tab
              icon={<LockIcon />}
              label="Privacy"
              {...a11yProps(2)}
              sx={{
                minHeight: '72px',
                '&.Mui-selected': { color: '#facc15' }
              }}
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <TabPanel value={value} index={0}>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Control how and when you receive notifications from CoachAI.
            </Typography>
            <Divider sx={{ my: 2 }} />

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.email}
                    onChange={handleSettingChange('notifications', 'email')}
                    color="primary"
                  />
                }
                label="Email notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.push}
                    onChange={handleSettingChange('notifications', 'push')}
                    color="primary"
                  />
                }
                label="Push notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.sms}
                    onChange={handleSettingChange('notifications', 'sms')}
                    color="primary"
                  />
                }
                label="SMS notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.newsletter}
                    onChange={handleSettingChange('notifications', 'newsletter')}
                    color="primary"
                  />
                }
                label="Weekly newsletter"
              />
            </FormGroup>
          </TabPanel>

          <TabPanel value={value} index={1}>
            <Typography variant="h6" gutterBottom>
              Appearance Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Customize how CoachAI looks and feels to match your preferences.
            </Typography>
            <Divider sx={{ my: 2 }} />

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.appearance.darkMode}
                    onChange={handleSettingChange('appearance', 'darkMode')}
                    color="primary"
                  />
                }
                label="Dark mode"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.appearance.animations}
                    onChange={handleSettingChange('appearance', 'animations')}
                    color="primary"
                  />
                }
                label="Enable animations"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.appearance.highContrast}
                    onChange={handleSettingChange('appearance', 'highContrast')}
                    color="primary"
                  />
                }
                label="High contrast mode"
              />
            </FormGroup>
          </TabPanel>

          <TabPanel value={value} index={2}>
            <Typography variant="h6" gutterBottom>
              Privacy Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Control your data privacy and sharing preferences.
            </Typography>
            <Divider sx={{ my: 2 }} />

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.shareData}
                    onChange={handleSettingChange('privacy', 'shareData')}
                    color="primary"
                  />
                }
                label="Share data to improve coaching recommendations"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.allowAnalytics}
                    onChange={handleSettingChange('privacy', 'allowAnalytics')}
                    color="primary"
                  />
                }
                label="Allow usage analytics"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.showProfile}
                    onChange={handleSettingChange('privacy', 'showProfile')}
                    color="primary"
                  />
                }
                label="Show my profile to other users"
              />
            </FormGroup>
          </TabPanel>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={saveSettings}
          disabled={isSaving}
          sx={{
            bgcolor: '#facc15',
            color: 'black',
            borderRadius: '50px',
            px: 4,
            py: 1.5,
            fontWeight: 'bold',
            '&:hover': {
              bgcolor: '#e6b800',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Container>
  );
} 