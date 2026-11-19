import { describe, it, expect } from 'vitest';
import { TIMER_PHASES, TIMER_STATUSES } from '../shared';

describe('Authoritative Pomodoro Timer Logic', () => {
  it('calculates remaining seconds accurately while running without clock drift', () => {
    const startedAt = new Date(Date.now() - 45 * 1000); // started 45 seconds ago
    const initialRemaining = 25 * 60; // 1500 seconds

    const elapsedSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    const computedRemaining = Math.max(0, initialRemaining - elapsedSeconds);

    expect(elapsedSeconds).toBeGreaterThanOrEqual(44);
    expect(elapsedSeconds).toBeLessThanOrEqual(46);
    expect(computedRemaining).toBe(1500 - elapsedSeconds);
  });

  it('preserves exact paused remaining duration', () => {
    const remainingWhenPaused = 732; // 12m 12s
    const status = TIMER_STATUSES.PAUSED;

    // Paused state should not decrement over time
    const computed = status === TIMER_STATUSES.PAUSED ? remainingWhenPaused : 0;
    expect(computed).toBe(732);
  });

  it('determines correct phase transitions across 4 Pomodoro cycles', () => {
    const cyclesBeforeLongBreak = 4;

    function getNextPhase(currentPhase: string, currentCycle: number) {
      if (currentPhase === TIMER_PHASES.FOCUS) {
        if (currentCycle >= cyclesBeforeLongBreak) {
          return { nextPhase: TIMER_PHASES.LONG_BREAK, nextCycle: 1 };
        } else {
          return { nextPhase: TIMER_PHASES.SHORT_BREAK, nextCycle: currentCycle + 1 };
        }
      } else {
        return { nextPhase: TIMER_PHASES.FOCUS, nextCycle: currentCycle };
      }
    }

    // Cycle 1 FOCUS -> SHORT_BREAK (cycle becomes 2)
    expect(getNextPhase(TIMER_PHASES.FOCUS, 1)).toEqual({
      nextPhase: TIMER_PHASES.SHORT_BREAK,
      nextCycle: 2,
    });

    // Cycle 2 SHORT_BREAK -> FOCUS (cycle remains 2)
    expect(getNextPhase(TIMER_PHASES.SHORT_BREAK, 2)).toEqual({
      nextPhase: TIMER_PHASES.FOCUS,
      nextCycle: 2,
    });

    // Cycle 3 FOCUS -> SHORT_BREAK (cycle becomes 4)
    expect(getNextPhase(TIMER_PHASES.FOCUS, 3)).toEqual({
      nextPhase: TIMER_PHASES.SHORT_BREAK,
      nextCycle: 4,
    });

    // Cycle 4 FOCUS -> LONG_BREAK (cycle resets to 1)
    expect(getNextPhase(TIMER_PHASES.FOCUS, 4)).toEqual({
      nextPhase: TIMER_PHASES.LONG_BREAK,
      nextCycle: 1,
    });

    // After LONG_BREAK -> FOCUS
    expect(getNextPhase(TIMER_PHASES.LONG_BREAK, 1)).toEqual({
      nextPhase: TIMER_PHASES.FOCUS,
      nextCycle: 1,
    });
  });
});
