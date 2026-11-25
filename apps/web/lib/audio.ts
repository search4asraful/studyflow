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

let lastCountdownPlayedAt = 0;
let lastCountdownSecond = -1;

/**
 * Plays a discrete warning countdown tick when a timer cycle has 1, 2, or 3 seconds remaining.
 * Synthesizes a gentle auditory pulse (sine wave with soft decay) to alert the user
 * 2-3 seconds before a cycle ends.
 */
export async function playTimerCountdownTick(secondsRemaining: number) {
  if (typeof window === 'undefined') return;

  const settings = getTaskAudioSettings();
  if (!settings.enabled) return;

  const nowMs = Date.now();
  // Prevent duplicate playback if triggered within 750ms for the same second
  if (lastCountdownSecond === secondsRemaining && nowMs - lastCountdownPlayedAt < 800) {
    return;
  }
  lastCountdownPlayedAt = nowMs;
  lastCountdownSecond = secondsRemaining;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pitch rises slightly on the final second: E5 (659Hz) -> E5 (659Hz) -> A5 (880Hz)
    const freq = secondsRemaining <= 1 ? 880.0 : 659.25;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch {
    // Ignore audio playback errors
  }
}

/**
 * Plays a standalone 2-3 second warning sequence before cycle completion.
 * Emits 3 gentle pulses over 2.5 seconds indicating a cycle is ending.
 */
export async function playTimerCycleWarning() {
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
    const pulses = [
      { offset: 0.0, freq: 659.25, gain: 0.16 },
      { offset: 0.85, freq: 659.25, gain: 0.16 },
      { offset: 1.7, freq: 880.0, gain: 0.2 },
    ];

    pulses.forEach(({ offset, freq, gain: peakGain }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + offset);

      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.linearRampToValueAtTime(peakGain, now + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.35);
    });
  } catch {
    // Ignore audio playback errors
  }
}

let lastChimePlayedAt = 0;

/**
 * Plays an authentic digital alarm clock sound ("beep-beep, beep-beep, beep-beep, beep-beep")
 * when a Pomodoro timer or cycle fully completes.
 * Mimics the classic electronic buzzer cadence of a digital alarm clock.
 */
export async function playTimerAlarmSound() {
  if (typeof window === 'undefined') return;

  const settings = getTaskAudioSettings();
  if (!settings.enabled) return;

  const nowMs = Date.now();
  if (nowMs - lastChimePlayedAt < 1800) {
    return;
  }
  lastChimePlayedAt = nowMs;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.28, now);
    masterGain.connect(ctx.destination);

    // Classic 4-pair digital alarm cadence: [beep, beep], [beep, beep], [beep, beep], [beep, beep]
    const beepPairs = [
      [0.0, 0.12],
      [0.34, 0.46],
      [0.68, 0.8],
      [1.02, 1.14],
    ];

    beepPairs.forEach(([start1, start2], pairIdx) => {
      [start1, start2].forEach((startTime, idxInPair) => {
        const beepStart = now + startTime;
        const beepDuration = 0.075;

        // Fundamental piezo buzzer frequency (approx 1046.5 Hz - C6)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // On the final pair, slight pitch lift (1174.66 Hz - D6) for urgency/resolution
        const freq = pairIdx === 3 && idxInPair === 1 ? 1174.66 : 1046.5;
        osc.type = 'square'; // Classic digital clock buzzer timbre
        osc.frequency.setValueAtTime(freq, beepStart);

        // Soften high square harmonics with a lowpass filter so it sounds punchy, not harsh
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, beepStart);

        // Fast attack & decay envelope
        gain.gain.setValueAtTime(0.0001, beepStart);
        gain.gain.linearRampToValueAtTime(0.22, beepStart + 0.005);
        gain.gain.setValueAtTime(0.22, beepStart + beepDuration - 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, beepStart + beepDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(beepStart);
        osc.stop(beepStart + beepDuration + 0.015);
      });
    });
  } catch {
    // Ignore audio playback errors
  }
}

export const playCompletionChime = playTimerAlarmSound;
export const playTimerCompletionSound = playTimerAlarmSound;

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
