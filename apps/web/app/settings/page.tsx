'use client';

import React, { useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { apiRequest } from '../../lib/api';
import { toast } from 'sonner';
import { User, Shield, Palette, Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const setUser = useAuthStore((s) => s.setUser);
  const { theme, setTheme, mounted } = useTheme();

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [dailyGoal, setDailyGoal] = useState(profile?.dailyGoalMinutes || 120);
  const [soundEnabled, setSoundEnabled] = useState(profile?.soundEnabled ?? true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiRequest<{ user: any; profile: any }>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          bio,
          dailyGoalMinutes: Number(dailyGoal),
          soundEnabled,
          themePreference: theme,
        }),
      });
      setUser(res.user, res.profile);
      toast.success('Profile preferences updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setChangingPassword(true);
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="pb-6 divider-subtle">
          <h1 className="heading-page">
            Settings &amp; Profile
          </h1>
          <p className="subheading-page">
            Manage your personal profile, color theme, notification sounds, and security credentials.
          </p>
        </div>

        {/* Appearance & Color Theme */}
        <div className="card-base p-7">
          <div className="flex items-center gap-2 mb-6 pb-4 divider-subtle">
            <Palette className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Appearance &amp; Theme System
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Choose your interface theme. Colors are dynamically driven by global CSS variables utilizing
              our template palette: <span className="font-mono text-foreground font-semibold">#F9F7F7</span>,{' '}
              <span className="font-mono text-foreground font-semibold">#DBE2EF</span>,{' '}
              <span className="font-mono text-foreground font-semibold">#3F72AF</span>, and{' '}
              <span className="font-mono text-foreground font-semibold">#112D4E</span>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Dark Theme Option */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`text-left p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between ${
                  mounted && theme === 'dark'
                    ? 'border-accent bg-surface-elevated ring-1 ring-accent'
                    : 'border-border bg-surface-subtle hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-foreground">Midnight Navy</span>
                  </div>
                  {mounted && theme === 'dark' && (
                    <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-3" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground-secondary mb-3">
                  Deep midnight navy canvas with royal blue accents and crisp light typography.
                </p>
                <div className="flex items-center gap-1.5 pt-2 border-t border-border-subtle">
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: '#112D4E' }} title="#112D4E" />
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: '#1E4575' }} title="#1E4575" />
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: '#3F72AF' }} title="#3F72AF" />
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: '#F9F7F7' }} title="#F9F7F7" />
                </div>
              </button>

              {/* Light Theme Option */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`text-left p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between ${
                  mounted && theme === 'light'
                    ? 'border-accent bg-surface-elevated ring-1 ring-accent'
                    : 'border-border bg-surface-subtle hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-foreground">Ice Blue &amp; White</span>
                  </div>
                  {mounted && theme === 'light' && (
                    <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-3" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground-secondary mb-3">
                  Clean light canvas with white cards, soft ice blue borders, and navy typography.
                </p>
                <div className="flex items-center gap-1.5 pt-2 border-t border-border-subtle">
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: '#F9F7F7' }} title="#F9F7F7" />
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: '#FFFFFF' }} title="#FFFFFF" />
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: '#DBE2EF' }} title="#DBE2EF" />
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: '#112D4E' }} title="#112D4E" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card-base p-7">
          <div className="flex items-center gap-2 mb-6 pb-4 divider-subtle">
            <User className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Public Profile &amp; Preferences
            </h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground-secondary">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Developer, student, focus topics..."
                className="input-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Daily Focus Target (Minutes)"
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                min={10}
                max={1440}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground-secondary">
                  Acoustic Chime
                </label>
                <label className="flex items-center gap-2.5 mt-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-border bg-surface-subtle text-accent focus:ring-accent"
                  />
                  <span className="text-xs text-foreground">
                    Play audio chime on Pomodoro phase transitions
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" variant="primary" size="md" isLoading={savingProfile}>
                Save Preferences
              </Button>
            </div>
          </form>
        </div>

        {/* Security / Password Change */}
        <div className="card-base p-7">
          <div className="flex items-center gap-2 mb-6 pb-4 divider-subtle">
            <Shield className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Security &amp; Credentials
            </h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="secondary" size="md" isLoading={changingPassword}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
