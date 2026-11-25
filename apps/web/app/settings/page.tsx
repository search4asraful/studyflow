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
  Target,
} from 'lucide-react';
import {
  getTaskAudioSettings,
  saveTaskAudioSettings,
  playTaskCompletionSound,
  playTimerCycleWarning,
  playCompletionChime,
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

            {/* Timer Cycle Countdown & Alarm Clock Completion Audio Preview */}
            <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Timer Cycle Alarm Clock &amp; Countdown Audio
                </span>
                <span className="text-[11px] text-foreground-secondary block mt-0.5">
                  Plays gentle countdown pulses 2–3s before cycle ends and a digital alarm clock sound upon cycle completion.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playTimerCycleWarning();
                  setTimeout(() => playCompletionChime(), 2600);
                  toast.info('Auditioning 2-3s countdown warning & alarm clock completion sound...');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-subtle hover:bg-surface-elevated text-xs font-semibold text-accent hover:border-accent/40 transition-all cursor-pointer shrink-0 self-start sm:self-auto shadow-2xs"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Audition Alarm Clock</span>
              </button>
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

            {/* Daily Focus Target Section with Visual Wheel & Calibrated Slider */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" />
                  <label className="text-xs font-semibold text-foreground">
                    Daily Focus Target
                  </label>
                </div>
                <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-2.5 py-0.5 rounded-md border border-accent/20">
                  {formatMinutes(dailyGoal)} ({dailyGoal} mins)
                </span>
              </div>

              {/* Target Dial & Slider Card */}
              <div className="p-4 rounded-xl bg-surface-subtle/80 border border-border/70 space-y-4">
                {/* Visual Target Wheel + Session Equivalent Stats */}
                <div className="flex items-center gap-4">
                  {/* Circular Target Wheel */}
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-border-subtle"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-accent transition-all duration-300 ease-out"
                        strokeDasharray={`${Math.min(100, Math.round((dailyGoal / 480) * 100))}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[11px] font-mono font-bold text-foreground leading-none">
                        {Math.min(100, Math.round((dailyGoal / 480) * 100))}%
                      </span>
                      <span className="text-[8px] font-mono text-foreground-muted leading-tight mt-0.5">
                        of 8h
                      </span>
                    </div>
                  </div>

                  {/* Target Description & Presets */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">
                        {formatMinutes(dailyGoal)} daily commitment
                      </p>
                      <span className="text-[11px] font-mono text-foreground-muted">
                        ~{Math.round((dailyGoal / 25) * 10) / 10} sessions
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground-secondary mt-0.5">
                      Sets your benchmark for daily focus rings across the dashboard and analytics.
                    </p>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {[
                        { label: '30m', mins: 30 },
                        { label: '1h', mins: 60 },
                        { label: '2h', mins: 120 },
                        { label: '3h', mins: 180 },
                        { label: '4h', mins: 240 },
                        { label: '6h', mins: 360 },
                        { label: '8h', mins: 480 },
                      ].map((preset) => (
                        <button
                          key={preset.mins}
                          type="button"
                          onClick={() => setDailyGoal(preset.mins)}
                          className={cn(
                            'px-2 py-0.5 text-[10px] font-mono font-medium rounded-md border transition-all cursor-pointer',
                            dailyGoal === preset.mins
                              ? 'bg-accent text-white border-accent shadow-2xs font-semibold'
                              : 'bg-surface-elevated text-foreground-secondary border-border hover:border-accent/40 hover:text-foreground'
                          )}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Slider Track with Perfectly Centered Thumb Wheel and Mathematically Calibrated Markers */}
                <div className="space-y-1.5 pt-1">
                  <div className="relative w-full">
                    <input
                      type="range"
                      min="15"
                      max="480"
                      step="15"
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(Number(e.target.value))}
                      className="slider-accent w-full cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, rgb(var(--accent-rgb)) 0%, rgb(var(--accent-rgb)) ${((dailyGoal - 15) / 465) * 100}%, var(--border-subtle) ${((dailyGoal - 15) / 465) * 100}%, var(--border-subtle) 100%)`,
                      }}
                    />
                  </div>

                  {/* Accurately Calibrated Milestones matching exact thumb wheel center */}
                  <div className="relative w-full h-5">
                    {[
                      { minutes: 15, label: '15m' },
                      { minutes: 120, label: '2h (120m)' },
                      { minutes: 240, label: '4h (240m)' },
                      { minutes: 480, label: '8h (480m)' },
                    ].map((m) => {
                      const pct = ((m.minutes - 15) / 465) * 100;
                      const isSelected = dailyGoal === m.minutes;
                      return (
                        <button
                          key={m.minutes}
                          type="button"
                          onClick={() => setDailyGoal(m.minutes)}
                          style={{
                            left: `calc(${pct}% + ${(0.5 - pct / 100) * 20}px)`,
                          }}
                          className="absolute -translate-x-1/2 flex flex-col items-center group cursor-pointer transition-colors"
                          title={`Set target to ${m.label}`}
                        >
                          <span
                            className={cn(
                              'text-[10px] font-mono transition-colors whitespace-nowrap',
                              isSelected
                                ? 'text-accent font-bold'
                                : 'text-foreground-muted group-hover:text-foreground'
                            )}
                          >
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
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
