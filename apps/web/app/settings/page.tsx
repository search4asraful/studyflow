'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { apiRequest } from '../../lib/api';
import { toast } from 'sonner';
import {
  User,
  Shield,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
} from 'lucide-react';
import {
  getTaskAudioSettings,
  saveTaskAudioSettings,
  playTaskCompletionSound,
  TaskSoundStyle,
  TaskAudioSettings,
  DEFAULT_TASK_AUDIO_SETTINGS,
} from '../../lib/audio';
import { cn, formatMinutes } from '../../lib/utils';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const setUser = useAuthStore((s) => s.setUser);

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [dailyGoal, setDailyGoal] = useState(profile?.dailyGoalMinutes || 120);
  const [savingProfile, setSavingProfile] = useState(false);

  // Task Audio Settings state
  const [taskAudio, setTaskAudio] = useState<TaskAudioSettings>(DEFAULT_TASK_AUDIO_SETTINGS);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Load saved task audio settings on mount
  useEffect(() => {
    setTaskAudio(getTaskAudioSettings());
  }, []);

  const handleToggleMute = () => {
    const nextEnabled = !taskAudio.enabled;
    const updated = saveTaskAudioSettings({ enabled: nextEnabled });
    setTaskAudio(updated);
    toast.success(nextEnabled ? 'Task completion sound unmuted' : 'Task completion sound muted');
  };

  const handleSelectStyle = (style: TaskSoundStyle) => {
    const updated = saveTaskAudioSettings({ style });
    setTaskAudio(updated);
    playTaskCompletionSound(style, true);
    toast.success(`Task sound set to ${style.charAt(0).toUpperCase() + style.slice(1)}`);
  };

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
          soundEnabled: taskAudio.enabled,
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
        <div>
          <h1 className="heading-page">Settings &amp; Preferences</h1>
          <p className="subheading-page">
            Customize your task completion sound, daily focus goals, and security credentials.
          </p>
        </div>

        {/* Task Completion Sound Card */}
        <div className="card-elevated p-6 sm:p-7 space-y-5 border-accent/25">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Task Completion Sound
                </h2>
              </div>
              <p className="text-xs text-foreground-secondary mt-1">
                Synthesized Web Audio cue played whenever a collaborative task is completed.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleMute}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all shrink-0 self-start sm:self-auto shadow-2xs',
                taskAudio.enabled
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
              )}
              title={taskAudio.enabled ? 'Click to mute sound' : 'Click to unmute sound'}
            >
              {taskAudio.enabled ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Sound Active</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Sound Muted</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-medium text-foreground-secondary block">
              Choose Sound Style
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'fanfare' as const, name: 'Uplifting Fanfare', desc: 'Ascending major chord' },
                { id: 'success' as const, name: 'Joyful Chime', desc: 'Bright 2-note resolution' },
                { id: 'levelup' as const, name: 'Level Up', desc: 'Arcade sparkle arpeggio' },
                { id: 'crystal' as const, name: 'Crystal Bell', desc: 'Harmonic crystal bell' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleSelectStyle(style.id)}
                  className={cn(
                    'p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between group cursor-pointer',
                    taskAudio.style === style.id
                      ? 'border-accent bg-accent/15 ring-1 ring-accent'
                      : 'border-border bg-surface-subtle hover:border-accent/40'
                  )}
                >
                  <div>
                    <span className="text-xs font-semibold text-foreground block group-hover:text-accent transition-colors">
                      {style.name}
                    </span>
                    <span className="text-[10px] text-foreground-muted block mt-0.5">
                      {style.desc}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-accent mt-3 font-semibold">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Audition</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card-base p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Public Profile &amp; Goals
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

            {/* Daily Goal with Live Time Converter */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-foreground-secondary">
                  Daily Focus Target
                </label>
                <span className="text-xs font-mono font-bold text-accent">
                  {formatMinutes(dailyGoal)} ({dailyGoal} mins)
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="480"
                step="15"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full h-2 bg-surface-subtle rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[10px] font-mono text-foreground-muted">
                <span>15m</span>
                <span>2h (120m)</span>
                <span>4h (240m)</span>
                <span>8h (480m)</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" variant="primary" size="md" isLoading={savingProfile} className="px-6 font-semibold shadow-md shadow-accent/25">
                Save Preferences
              </Button>
            </div>
          </form>
        </div>

        {/* Security / Password Change */}
        <div className="card-base p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
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
              <Button type="submit" variant="secondary" size="md" isLoading={changingPassword} className="px-6">
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
