'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Palette, Lock, Save } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/firebase/authContext';
import { db } from '@/lib/firebase/firebaseConfig';
import AuthModal from '@/components/auth/AuthModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

type SettingsShape = {
  notifications: { email: boolean; push: boolean; sms: boolean; newsletter: boolean };
  appearance: { darkMode: boolean; animations: boolean; highContrast: boolean };
  privacy: { shareData: boolean; allowAnalytics: boolean; showProfile: boolean };
};

function SettingRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-sm text-text-muted">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Settings state
  const [settings, setSettings] = useState<SettingsShape>({
    notifications: { email: true, push: true, sms: false, newsletter: true },
    appearance: { darkMode: true, animations: true, highContrast: false },
    privacy: { shareData: true, allowAnalytics: true, showProfile: true },
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
        // Load settings from the user's Firestore document, merging over
        // the defaults so a partial saved document never drops fields.
        const snap = await getDoc(doc(db, 'users', user.uid));
        const saved = snap.exists()
          ? (snap.data().settings as Partial<SettingsShape> | undefined)
          : undefined;
        if (saved) {
          setSettings((prev) => ({
            notifications: { ...prev.notifications, ...saved.notifications },
            appearance: { ...prev.appearance, ...saved.appearance },
            privacy: { ...prev.privacy, ...saved.privacy },
          }));
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Could not load your saved settings.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user, loading]);

  const handleSettingChange =
    <C extends keyof SettingsShape>(category: C, setting: keyof SettingsShape[C]) =>
    (checked: boolean) => {
      setSettings((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [setting]: checked,
        },
      }));
    };

  const saveSettings = async () => {
    if (!user) return;

    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      // Persist settings on the user's Firestore document (merge so we don't
      // clobber other fields like saved plans).
      await setDoc(
        doc(db, 'users', user.uid),
        { settings, settingsUpdatedAt: new Date().toISOString() },
        { merge: true }
      );
      setSuccess('Settings saved to your account.');
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
          <p className="text-text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  const triggerClass =
    'gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground';

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <AuthModal open={showAuthModal} onClose={() => router.push('/')} onSuccess={handleAuthSuccess} />

      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            aria-label="Back to home"
            className="inline-flex size-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">Settings</h1>
        </div>

        {success && (
          <Alert tone="success" className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert tone="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="p-6">
          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="mb-4 grid grid-cols-3">
              <TabsTrigger value="notifications" className={triggerClass}>
                <Bell className="size-4" /> <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className={triggerClass}>
                <Palette className="size-4" /> <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className={triggerClass}>
                <Lock className="size-4" /> <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
            </TabsList>

            {/* Notifications */}
            <TabsContent value="notifications">
              <h2 className="font-serif text-lg font-semibold text-foreground">
                Notification preferences
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Control how and when you hear from your coach.
              </p>
              <Separator className="my-3" />
              <div className="divide-y divide-border">
                <SettingRow label="Email notifications" checked={settings.notifications.email} onCheckedChange={handleSettingChange('notifications', 'email')} />
                <SettingRow label="Push notifications" checked={settings.notifications.push} onCheckedChange={handleSettingChange('notifications', 'push')} />
                <SettingRow label="SMS notifications" checked={settings.notifications.sms} onCheckedChange={handleSettingChange('notifications', 'sms')} />
                <SettingRow label="Weekly newsletter" checked={settings.notifications.newsletter} onCheckedChange={handleSettingChange('notifications', 'newsletter')} />
              </div>
            </TabsContent>

            {/* Appearance */}
            <TabsContent value="appearance">
              <h2 className="font-serif text-lg font-semibold text-foreground">Appearance</h2>
              <p className="mt-1 text-sm text-text-muted">
                Customize how ThriveAI looks and feels.
              </p>
              <Separator className="my-3" />
              <div className="divide-y divide-border">
                <SettingRow label="Dark mode" checked={settings.appearance.darkMode} onCheckedChange={handleSettingChange('appearance', 'darkMode')} />
                <SettingRow label="Enable animations" checked={settings.appearance.animations} onCheckedChange={handleSettingChange('appearance', 'animations')} />
                <SettingRow label="High contrast mode" checked={settings.appearance.highContrast} onCheckedChange={handleSettingChange('appearance', 'highContrast')} />
              </div>
            </TabsContent>

            {/* Privacy */}
            <TabsContent value="privacy">
              <h2 className="font-serif text-lg font-semibold text-foreground">Privacy</h2>
              <p className="mt-1 text-sm text-text-muted">
                Control your data privacy and sharing preferences.
              </p>
              <Separator className="my-3" />
              <div className="divide-y divide-border">
                <SettingRow label="Share data to improve coaching recommendations" checked={settings.privacy.shareData} onCheckedChange={handleSettingChange('privacy', 'shareData')} />
                <SettingRow label="Allow usage analytics" checked={settings.privacy.allowAnalytics} onCheckedChange={handleSettingChange('privacy', 'allowAnalytics')} />
                <SettingRow label="Show my profile to other users" checked={settings.privacy.showProfile} onCheckedChange={handleSettingChange('privacy', 'showProfile')} />
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-xs text-text-muted">Preferences are saved to your account.</p>
          <Button variant="primary" onClick={saveSettings} disabled={isSaving}>
            <Save className="size-4" />
            {isSaving ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
