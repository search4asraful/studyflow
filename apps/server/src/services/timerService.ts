import { TimerPhase, TimerStatus, RoomRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthoritativeTimerState, SOCKET_EVENTS } from '../shared';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import type { Server as SocketIOServer } from 'socket.io';

export class TimerService {
  private static io: SocketIOServer | null = null;
  private static ticker: NodeJS.Timeout | null = null;
  // In-memory set of room IDs that currently have RUNNING timers to monitor
  private static activeRunningRooms = new Set<string>();
  // Active participants per room: Map<roomId, Set<userId>>
  private static roomParticipants = new Map<string, Set<string>>();

  static setSocketServer(io: SocketIOServer) {
    this.io = io;
    this.startGlobalTicker();
  }

  static registerParticipant(roomId: string, userId: string) {
    if (!this.roomParticipants.has(roomId)) {
      this.roomParticipants.set(roomId, new Set());
    }
    this.roomParticipants.get(roomId)!.add(userId);
  }

  static unregisterParticipant(roomId: string, userId: string) {
    const participants = this.roomParticipants.get(roomId);
    if (participants) {
      participants.delete(userId);
      if (participants.size === 0) {
        this.roomParticipants.delete(roomId);
      }
    }
  }

  static getActiveParticipants(roomId: string): string[] {
    const participants = this.roomParticipants.get(roomId);
    return participants ? Array.from(participants) : [];
  }

  /**
   * Initializes timer states on server startup, restoring any running timers
   */
  static async initializeFromDatabase() {
    const runningTimers = await prisma.timerState.findMany({
      where: { status: TimerStatus.RUNNING },
      include: { room: true },
    });

    const now = Date.now();
    for (const timer of runningTimers) {
      if (timer.startedAt) {
        const elapsed = Math.floor((now - timer.startedAt.getTime()) / 1000);
        const remaining = Math.max(0, timer.remainingSeconds - elapsed);
        if (remaining <= 0) {
          // Completed while server was restarting
          await this.handlePhaseCompletion(timer.roomId);
        } else {
          this.activeRunningRooms.add(timer.roomId);
        }
      }
    }
    console.log(`[TimerService] Initialized: ${this.activeRunningRooms.size} active timers running.`);
  }

  /**
   * Authoritative calculation of remaining time for a room
   */
  static async getAuthoritativeState(roomId: string): Promise<AuthoritativeTimerState> {
    let timerState = await prisma.timerState.findUnique({
      where: { roomId },
      include: { room: true },
    });

    if (!timerState) {
      // Lazy initialize default state if not found
      const room = await prisma.studyRoom.findUnique({ where: { id: roomId } });
      if (!room) {
        throw new NotFoundError('Study room not found');
      }

      timerState = await prisma.timerState.create({
        data: {
          roomId,
          phase: TimerPhase.FOCUS,
          status: TimerStatus.IDLE,
          remainingSeconds: room.focusDuration,
          totalPhaseDuration: room.focusDuration,
          currentCycle: 1,
        },
        include: { room: true },
      });
    }

    let computedRemaining = timerState.remainingSeconds;

    if (timerState.status === TimerStatus.RUNNING && timerState.startedAt) {
      const elapsedSeconds = Math.floor((Date.now() - timerState.startedAt.getTime()) / 1000);
      computedRemaining = Math.max(0, timerState.remainingSeconds - elapsedSeconds);
    }

    return {
      roomId: timerState.roomId,
      sessionId: timerState.sessionId,
      phase: timerState.phase,
      status: timerState.status,
      startedAt: timerState.startedAt ? timerState.startedAt.toISOString() : null,
      pausedAt: timerState.pausedAt ? timerState.pausedAt.toISOString() : null,
      remainingSeconds: computedRemaining,
      totalPhaseDuration: timerState.totalPhaseDuration,
      currentCycle: timerState.currentCycle,
      serverTimestamp: Date.now(),
    };
  }

  /**
   * Start Timer (Authorized: Room Owner or Moderator)
   */
  static async startTimer(roomId: string, userId: string): Promise<AuthoritativeTimerState> {
    await this.assertCanControlTimer(roomId, userId);

    const room = await prisma.studyRoom.findUnique({
      where: { id: roomId },
      include: { timerState: true },
    });

    if (!room) throw new NotFoundError('Room not found');

    const now = new Date();
    const currentTimer = room.timerState;

    // Check if session exists or create one
    let sessionId = currentTimer?.sessionId;
    if (!sessionId) {
      const session = await prisma.studySession.create({
        data: {
          roomId,
          startedAt: now,
        },
      });
      sessionId = session.id;
    }

    let initialRemaining = currentTimer?.remainingSeconds ?? room.focusDuration;
    if (!currentTimer || currentTimer.status === TimerStatus.IDLE || currentTimer.status === TimerStatus.COMPLETED) {
      initialRemaining = room.focusDuration;
    }

    const updated = await prisma.timerState.upsert({
      where: { roomId },
      create: {
        roomId,
        sessionId,
        phase: TimerPhase.FOCUS,
        status: TimerStatus.RUNNING,
        startedAt: now,
        pausedAt: null,
        remainingSeconds: room.focusDuration,
        totalPhaseDuration: room.focusDuration,
        currentCycle: 1,
      },
      update: {
        sessionId,
        status: TimerStatus.RUNNING,
        startedAt: now,
        pausedAt: null,
        remainingSeconds: initialRemaining,
      },
    });

    this.activeRunningRooms.add(roomId);

    const authoritative = await this.getAuthoritativeState(roomId);
    this.broadcastTimerState(roomId, authoritative);

    // Log room activity
    await prisma.roomActivity.create({
      data: {
        roomId,
        userId,
        action: 'TIMER_STARTED',
        details: `Started ${updated.phase} session`,
      },
    });

    return authoritative;
  }

  /**
   * Pause Timer (Authorized: Room Owner or Moderator)
   */
  static async pauseTimer(roomId: string, userId: string): Promise<AuthoritativeTimerState> {
    await this.assertCanControlTimer(roomId, userId);

    const current = await this.getAuthoritativeState(roomId);
    if (current.status !== TimerStatus.RUNNING) {
      return current;
    }

    const now = new Date();

    await prisma.timerState.update({
      where: { roomId },
      data: {
        status: TimerStatus.PAUSED,
        pausedAt: now,
        remainingSeconds: current.remainingSeconds,
        startedAt: null,
      },
    });

    this.activeRunningRooms.delete(roomId);

    const updated = await this.getAuthoritativeState(roomId);
    this.broadcastTimerState(roomId, updated);

    await prisma.roomActivity.create({
      data: {
        roomId,
        userId,
        action: 'TIMER_PAUSED',
        details: `Paused timer at ${Math.floor(current.remainingSeconds / 60)}m ${current.remainingSeconds % 60}s`,
      },
    });

    return updated;
  }

  /**
   * Resume Timer (Authorized: Room Owner or Moderator)
   */
  static async resumeTimer(roomId: string, userId: string): Promise<AuthoritativeTimerState> {
    await this.assertCanControlTimer(roomId, userId);

    const current = await this.getAuthoritativeState(roomId);
    if (current.status !== TimerStatus.PAUSED) {
      return current;
    }

    const now = new Date();

    await prisma.timerState.update({
      where: { roomId },
      data: {
        status: TimerStatus.RUNNING,
        startedAt: now,
        pausedAt: null,
      },
    });

    this.activeRunningRooms.add(roomId);

    const updated = await this.getAuthoritativeState(roomId);
    this.broadcastTimerState(roomId, updated);

    await prisma.roomActivity.create({
      data: {
        roomId,
        userId,
        action: 'TIMER_RESUMED',
        details: `Resumed timer`,
      },
    });

    return updated;
  }

  /**
   * Skip Phase (Authorized: Room Owner or Moderator)
   */
  static async skipPhase(
    roomId: string,
    userId: string,
    targetPhase?: TimerPhase
  ): Promise<AuthoritativeTimerState> {
    await this.assertCanControlTimer(roomId, userId);

    const updated = await this.transitionToNextPhase(roomId, targetPhase);

    await prisma.roomActivity.create({
      data: {
        roomId,
        userId,
        action: 'TIMER_SKIPPED',
        details: `Skipped to ${updated.phase}`,
      },
    });

    return updated;
  }

  /**
   * Handle Phase Completion when timer reaches 0
   */
  private static async handlePhaseCompletion(roomId: string) {
    const timer = await prisma.timerState.findUnique({
      where: { roomId },
      include: { room: true },
    });

    if (!timer) return;

    // If it was a FOCUS phase, record Pomodoros for all connected room members!
    if (timer.phase === TimerPhase.FOCUS) {
      const activeUserIds = this.getActiveParticipants(roomId);

      // Also ensure room owner and room members who were in the session are rewarded
      const participantsToAward = new Set(activeUserIds);

      // If activeUserIds is empty (e.g. running background), award at least room owner
      if (participantsToAward.size === 0) {
        participantsToAward.add(timer.room.ownerId);
      }

      const focusMinutes = Math.round(timer.totalPhaseDuration / 60);

      for (const uid of participantsToAward) {
        await prisma.pomodoroRecord.create({
          data: {
            userId: uid,
            roomId,
            sessionId: timer.sessionId,
            phase: TimerPhase.FOCUS,
            durationMinutes: focusMinutes,
            completedAt: new Date(),
          },
        });
      }

      // Update session statistics
      if (timer.sessionId) {
        await prisma.studySession.update({
          where: { id: timer.sessionId },
          data: {
            completedPomodoros: { increment: 1 },
            totalDuration: { increment: timer.totalPhaseDuration },
          },
        });
      }
    }

    await this.transitionToNextPhase(roomId);
  }

  /**
   * Transitions to the next Pomodoro phase
   */
  private static async transitionToNextPhase(
    roomId: string,
    forcedPhase?: TimerPhase
  ): Promise<AuthoritativeTimerState> {
    const room = await prisma.studyRoom.findUnique({
      where: { id: roomId },
      include: { timerState: true },
    });

    if (!room || !room.timerState) {
      throw new NotFoundError('Room timer not found');
    }

    const current = room.timerState;
    let nextPhase: TimerPhase;
    let nextDuration: number;
    let nextCycle = current.currentCycle;

    if (forcedPhase) {
      nextPhase = forcedPhase;
      nextDuration =
        forcedPhase === TimerPhase.FOCUS
          ? room.focusDuration
          : forcedPhase === TimerPhase.SHORT_BREAK
          ? room.shortBreakDuration
          : room.longBreakDuration;
    } else {
      if (current.phase === TimerPhase.FOCUS) {
        if (current.currentCycle >= room.cyclesBeforeLongBreak) {
          nextPhase = TimerPhase.LONG_BREAK;
          nextDuration = room.longBreakDuration;
          nextCycle = 1; // Reset cycle after long break
        } else {
          nextPhase = TimerPhase.SHORT_BREAK;
          nextDuration = room.shortBreakDuration;
          nextCycle = current.currentCycle + 1;
        }
      } else {
        // From Short Break or Long Break -> Back to Focus
        nextPhase = TimerPhase.FOCUS;
        nextDuration = room.focusDuration;
      }
    }

    const now = new Date();
    const nextStatus: TimerStatus = TimerStatus.RUNNING;

    await prisma.timerState.update({
      where: { roomId },
      data: {
        phase: nextPhase,
        status: nextStatus,
        startedAt: now,
        pausedAt: null,
        remainingSeconds: nextDuration,
        totalPhaseDuration: nextDuration,
        currentCycle: nextCycle,
      },
    });

    if (nextStatus === TimerStatus.RUNNING) {
      this.activeRunningRooms.add(roomId);
    } else {
      this.activeRunningRooms.delete(roomId);
    }

    const authoritative = await this.getAuthoritativeState(roomId);

    if (this.io) {
      this.io.to(`room:${roomId}`).emit(SOCKET_EVENTS.SERVER.TIMER_PHASE_CHANGED, {
        previousPhase: current.phase,
        newPhase: nextPhase,
        timerState: authoritative,
      });
      this.broadcastTimerState(roomId, authoritative);
    }

    return authoritative;
  }

  /**
   * Global 1-second server heartbeat ticker
   */
  private static startGlobalTicker() {
    if (this.ticker) return;

    this.ticker = setInterval(async () => {
      if (this.activeRunningRooms.size === 0) return;

      const runningIds = Array.from(this.activeRunningRooms);
      for (const roomId of runningIds) {
        try {
          const state = await this.getAuthoritativeState(roomId);
          if (state.status === TimerStatus.RUNNING) {
            if (state.remainingSeconds <= 0) {
              await this.handlePhaseCompletion(roomId);
            } else {
              // Broadcast lightweight tick to room participants every second
              if (this.io) {
                this.io.to(`room:${roomId}`).emit(SOCKET_EVENTS.SERVER.TIMER_TICK, {
                  remainingSeconds: state.remainingSeconds,
                  serverTimestamp: state.serverTimestamp,
                });
              }
            }
          } else {
            this.activeRunningRooms.delete(roomId);
          }
        } catch {
          // Handled safely without leaking internal errors
        }
      }
    }, 1000);
  }

  private static broadcastTimerState(roomId: string, state: AuthoritativeTimerState) {
    if (this.io) {
      this.io.to(`room:${roomId}`).emit(SOCKET_EVENTS.SERVER.TIMER_STATE, state);
    }
  }

  private static async assertCanControlTimer(roomId: string, userId: string) {
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: { roomId, userId },
      },
    });

    if (!membership) {
      throw new ForbiddenError('You must be a member of this room');
    }

    if (membership.role !== RoomRole.OWNER && membership.role !== RoomRole.MODERATOR) {
      throw new ForbiddenError('Only the room owner or moderators can control the timer');
    }
  }
}
