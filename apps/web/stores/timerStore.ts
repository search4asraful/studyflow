import { create } from 'zustand';
import { AuthoritativeTimerState, TimerPhase, TimerStatus } from '@studyflow/shared';

interface TimerStoreState {
  authoritativeState: AuthoritativeTimerState | null;
  displaySeconds: number;
  phase: TimerPhase;
  status: TimerStatus;
  currentCycle: number;
  totalPhaseDuration: number;
  percentRemaining: number;

  syncAuthoritativeState: (state: AuthoritativeTimerState) => void;
  syncTick: (remainingSeconds: number, serverTimestamp: number) => void;
  localTick: () => void;
  resetTimer: () => void;
}

export const useTimerStore = create<TimerStoreState>((set, get) => ({
  authoritativeState: null,
  displaySeconds: 25 * 60,
  phase: 'FOCUS',
  status: 'IDLE',
  currentCycle: 1,
  totalPhaseDuration: 25 * 60,
  percentRemaining: 100,

  syncAuthoritativeState: (state) => {
    const duration = state.totalPhaseDuration || 1500;
    const percent = Math.min(100, Math.max(0, (state.remainingSeconds / duration) * 100));

    set({
      authoritativeState: state,
      displaySeconds: state.remainingSeconds,
      phase: state.phase,
      status: state.status,
      currentCycle: state.currentCycle,
      totalPhaseDuration: duration,
      percentRemaining: percent,
    });
  },

  syncTick: (serverRemaining, _serverTimestamp) => {
    const currentDisplay = get().displaySeconds;
    const duration = get().totalPhaseDuration;

    // Reconcile if client drifted by more than 1 second
    if (Math.abs(currentDisplay - serverRemaining) >= 1) {
      const percent = Math.min(100, Math.max(0, (serverRemaining / duration) * 100));
      set({
        displaySeconds: serverRemaining,
        percentRemaining: percent,
      });
    }
  },

  localTick: () => {
    const state = get();
    if (state.status === 'RUNNING' && state.displaySeconds > 0) {
      const nextSeconds = state.displaySeconds - 1;
      const percent = Math.min(
        100,
        Math.max(0, (nextSeconds / state.totalPhaseDuration) * 100)
      );
      set({
        displaySeconds: nextSeconds,
        percentRemaining: percent,
      });
    }
  },

  resetTimer: () =>
    set({
      authoritativeState: null,
      displaySeconds: 25 * 60,
      phase: 'FOCUS',
      status: 'IDLE',
      currentCycle: 1,
      totalPhaseDuration: 25 * 60,
      percentRemaining: 100,
    }),
}));
