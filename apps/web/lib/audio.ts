/**
 * Web Audio API synthesized sound feedback for StudyFlow.
 * Focused exclusively on Task Completion feedback with zero external assets.
 */

export type TaskSoundStyle = 'fanfare' | 'success' | 'levelup' | 'crystal';

export interface TaskAudioSettings {
  enabled: boolean;
  style: TaskSoundStyle;
}

export const DEFAULT_TASK_AUDIO_SETTINGS: TaskAudioSettings = {
  enabled: true,
  style: 'fanfare',
};

const SETTINGS_KEY = 'studyflow_task_audio_settings';

let sharedAudioContext: AudioContext | null = null;

/**
 * Returns a singleton AudioContext to prevent exceeding hardware context limits (max 6).
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioContextClass();
    }

    return sharedAudioContext;
  } catch {
    return null;
  }
}

/**
 * Auto-unlock Web Audio on user interaction.
 */
if (typeof window !== 'undefined') {
  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {
      // Ignore
    }
  };

  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true, passive: true });
  window.addEventListener('click', unlock, { once: true, passive: true });
}

/**
 * Retrieves task audio preferences (enabled state + chosen sound style).
 */
export function getTaskAudioSettings(): TaskAudioSettings {
  if (typeof window === 'undefined') return DEFAULT_TASK_AUDIO_SETTINGS;

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_TASK_AUDIO_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed.enabled ?? true,
      style: parsed.style || 'fanfare',
    };
  } catch {
    return DEFAULT_TASK_AUDIO_SETTINGS;
  }
}

/**
 * Saves task audio preferences to localStorage.
 */
export function saveTaskAudioSettings(settings: Partial<TaskAudioSettings>): TaskAudioSettings {
  const current = getTaskAudioSettings();
  const updated: TaskAudioSettings = {
    ...current,
    ...settings,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  return updated;
}

/**
 * Plays a satisfying harmonic audio cue when a collaborative task is completed.
 * Respects user's mute state and selected sound style.
 */
export async function playTaskCompletionSound(style?: TaskSoundStyle, ignoreMute: boolean = false) {
  if (typeof window === 'undefined') return;

  const settings = getTaskAudioSettings();
  if (!ignoreMute && !settings.enabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const preferredStyle: TaskSoundStyle = style || settings.style || 'fanfare';
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.4, now);
    masterGain.connect(ctx.destination);

    switch (preferredStyle) {
      case 'fanfare': {
        // Uplifting major triad chord: C5 -> E5 -> G5
        const notes = [523.25, 659.25, 783.99];
        const noteGains = [0.24, 0.26, 0.3];

        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          const noteStart = now + i * 0.075;
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.0001, noteStart);
          gain.gain.linearRampToValueAtTime(noteGains[i], noteStart + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.9);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(noteStart);
          osc.stop(noteStart + 0.95);
        });
        break;
      }

      case 'success': {
        // Joyful 2-note resolution (E5 -> B5)
        const notes = [659.25, 987.77];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          const noteStart = now + i * 0.085;
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.0001, noteStart);
          gain.gain.linearRampToValueAtTime(0.28, noteStart + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.7);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(noteStart);
          osc.stop(noteStart + 0.75);
        });
        break;
      }

      case 'levelup': {
        // Fast 4-note ascending arcade sparkle (C5, G5, C6, E6)
        const notes = [523.25, 783.99, 1046.5, 1318.51];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          const noteStart = now + i * 0.05;
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.0001, noteStart);
          gain.gain.linearRampToValueAtTime(0.24, noteStart + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.5);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(noteStart);
          osc.stop(noteStart + 0.55);
        });
        break;
      }

      case 'crystal':
      default: {
        // High harmonic crystal bell (C5, G5, C6, E6)
        const notes = [523.25, 783.99, 1046.5, 1318.51];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          const noteStart = now + i * 0.07;
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.0001, noteStart);
          gain.gain.linearRampToValueAtTime(0.24, noteStart + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.2);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(noteStart);
          osc.stop(noteStart + 1.25);
        });
        break;
      }
    }
  } catch (err) {
    console.warn('Task audio playback failed:', err);
  }
}

// Backwards-compatibility no-op stubs so any legacy calls never throw
export async function playCompletionChime() {}

/**
 * Plays a subtle, pleasant harmonic notification sound for incoming chat messages.
 */
export async function playChatSound() {
  if (typeof window === 'undefined') return;
  const settings = getTaskAudioSettings();
  if (!settings.enabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // Ignore audio playback errors
  }
}

export async function playUiClickSound() {}
