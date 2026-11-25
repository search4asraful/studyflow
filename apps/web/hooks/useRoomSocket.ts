'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import { useRoomStore } from '../stores/roomStore';
import { useTimerStore } from '../stores/timerStore';
import { useAuthStore } from '../stores/authStore';
import { broadcastTimerSync } from '../lib/tabSync';
import { SOCKET_EVENTS, AuthoritativeTimerState, Task, RoomActivity, RoomRole } from '@studyflow/shared';
import { toast } from 'sonner';
import { playCompletionChime } from '../lib/audio';

import { apiRequest } from '../lib/api';

export function useRoomSocket(roomId: string | undefined) {
  const setRoomState = useRoomStore((s) => s.setRoomState);
  const addMember = useRoomStore((s) => s.addMember);
  const updateMemberOnlineStatus = useRoomStore((s) => s.updateMemberOnlineStatus);
  const updateMemberRole = useRoomStore((s) => s.updateMemberRole);
  const addTask = useRoomStore((s) => s.addTask);
  const updateTask = useRoomStore((s) => s.updateTask);
  const deleteTask = useRoomStore((s) => s.deleteTask);
  const addActivity = useRoomStore((s) => s.addActivity);

  const syncAuthoritativeState = useTimerStore((s) => s.syncAuthoritativeState);
  const syncTick = useTimerStore((s) => s.syncTick);
  const localTick = useTimerStore((s) => s.localTick);

  const localTickerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const isLeavingRef = useRef(false);

  const joinRoom = useCallback(() => {
    if (!roomId || isLeavingRef.current) return;
    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      SOCKET_EVENTS.CLIENT.ROOM_JOIN,
      { roomId },
      (response: { success: boolean; data?: any; error?: string }) => {
        if (isLeavingRef.current) return;
        if (response?.success && response.data) {
          setRoomState(response.data);
          if (response.data.timerState) {
            syncAuthoritativeState(response.data.timerState);
            broadcastTimerSync(roomId, response.data.timerState);
          }
        } else if (response?.error) {
          toast.error(response.error);
        }
      }
    );
  }, [roomId, setRoomState, syncAuthoritativeState]);

  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();

    // 1. Initial room join
    joinRoom();

    // 2. Re-join room automatically on socket connection / reconnection
    socket.on('connect', joinRoom);

    // Socket Event Listeners
    const onRoomState = (payload: any) => {
      setRoomState(payload);
      if (payload.timerState) {
        syncAuthoritativeState(payload.timerState);
        broadcastTimerSync(roomId, payload.timerState);
      }
    };

    const onTimerState = (state: AuthoritativeTimerState) => {
      syncAuthoritativeState(state);
      broadcastTimerSync(roomId, state);
    };

    const onTimerTick = (data: { remainingSeconds: number; serverTimestamp: number }) => {
      syncTick(data.remainingSeconds, data.serverTimestamp);
    };

    const onTimerPhaseChanged = (data: {
      previousPhase: string;
      newPhase: string;
      timerState: AuthoritativeTimerState;
    }) => {
      syncAuthoritativeState(data.timerState);
      broadcastTimerSync(roomId, data.timerState);
      playCompletionChime();
      toast.success(
        `Phase changed: ${data.previousPhase.replace('_', ' ')} completed! Starting ${data.newPhase.replace('_', ' ')}.`
      );
    };

    const onParticipantJoined = (data: { user: any; roomId: string }) => {
      addMember(data.user);
      updateMemberOnlineStatus(data.user.id, true);
      toast.info(`${data.user.name} joined the room`);
    };

    const onParticipantLeft = (data: { userId: string; userName: string }) => {
      updateMemberOnlineStatus(data.userId, false);
    };

    const onTaskCreated = (task: Task) => {
      addTask(task);
      toast.info(`New task added: ${task.title}`);
    };

    const onTaskUpdated = (task: Task) => {
      updateTask(task);
    };

    const onTaskDeleted = (data: { id: string }) => {
      deleteTask(data.id);
      toast.info('Task removed');
    };

    const onRoomActivity = (activity: RoomActivity) => {
      addActivity(activity);
    };

    const onMemberRoleUpdated = (data: {
      roomId: string;
      targetUserId: string;
      newRole: RoomRole;
      previousRole: RoomRole;
      newOwnerId?: string;
      updatedByUserId: string;
    }) => {
      const currentAuthUser = useAuthStore.getState().user;
      updateMemberRole(data.targetUserId, data.newRole, data.newOwnerId, currentAuthUser?.id);
    };

    const onRoomError = (data: { message: string }) => {
      if (isLeavingRef.current) return;
      toast.error(data.message);
    };

    const onRoomDeleted = () => {
      if (isLeavingRef.current) return;
      isLeavingRef.current = true;
      toast.info('Study room was closed or deleted.');
      useRoomStore.getState().clearRoom();
      window.location.href = '/rooms';
    };

    socket.on(SOCKET_EVENTS.SERVER.ROOM_STATE, onRoomState);
    socket.on(SOCKET_EVENTS.SERVER.TIMER_STATE, onTimerState);
    socket.on(SOCKET_EVENTS.SERVER.TIMER_TICK, onTimerTick);
    socket.on(SOCKET_EVENTS.SERVER.TIMER_PHASE_CHANGED, onTimerPhaseChanged);
    socket.on(SOCKET_EVENTS.SERVER.ROOM_PARTICIPANT_JOINED, onParticipantJoined);
    socket.on(SOCKET_EVENTS.SERVER.ROOM_PARTICIPANT_LEFT, onParticipantLeft);
    socket.on(SOCKET_EVENTS.SERVER.TASK_CREATED, onTaskCreated);
    socket.on(SOCKET_EVENTS.SERVER.TASK_UPDATED, onTaskUpdated);
    socket.on(SOCKET_EVENTS.SERVER.TASK_DELETED, onTaskDeleted);
    socket.on(SOCKET_EVENTS.SERVER.ROOM_ACTIVITY, onRoomActivity);
    socket.on(SOCKET_EVENTS.SERVER.MEMBER_ROLE_UPDATED, onMemberRoleUpdated);
    socket.on(SOCKET_EVENTS.SERVER.ROOM_ERROR, onRoomError);
    socket.on(SOCKET_EVENTS.SERVER.ROOM_DELETED, onRoomDeleted);

    // Local 1s countdown ticker for buttery-smooth client experience
    localTickerRef.current = setInterval(() => {
      localTick();
    }, 1000);

    // Heartbeat every 20 seconds to keep connection alive and update online status
    heartbeatRef.current = setInterval(() => {
      if (isLeavingRef.current) return;
      if (socket.connected) {
        socket.emit(SOCKET_EVENTS.CLIENT.PARTICIPANT_HEARTBEAT, { roomId });
      }
    }, 20000);

    // Fast authoritative reconciliation when user switches back to this tab
    const handleFocusAndVisibility = () => {
      if (isLeavingRef.current) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        // Fast authoritative timer reconciliation on tab switch (without redundant room join)
        apiRequest<AuthoritativeTimerState>(`/rooms/${roomId}/timer`)
          .then((timerState) => {
            if (isLeavingRef.current) return;
            if (timerState) {
              syncAuthoritativeState(timerState);
            }
          })
          .catch(() => {});
      }
    };

    const handleCrossTabTimerSync = (e: Event) => {
      if (isLeavingRef.current) return;
      const customEvent = e as CustomEvent<{ roomId: string; timerState: AuthoritativeTimerState }>;
      if (customEvent.detail?.roomId === roomId && customEvent.detail?.timerState) {
        syncAuthoritativeState(customEvent.detail.timerState);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocusAndVisibility);
      window.addEventListener('studyflow:socket-reconnected', handleFocusAndVisibility);
      window.addEventListener('studyflow:tab-claimed', handleFocusAndVisibility);
      window.addEventListener('studyflow:timer-sync', handleCrossTabTimerSync);
      document.addEventListener('visibilitychange', handleFocusAndVisibility);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocusAndVisibility);
        window.removeEventListener('studyflow:socket-reconnected', handleFocusAndVisibility);
        window.removeEventListener('studyflow:tab-claimed', handleFocusAndVisibility);
        window.removeEventListener('studyflow:timer-sync', handleCrossTabTimerSync);
        document.removeEventListener('visibilitychange', handleFocusAndVisibility);
      }
      if (localTickerRef.current) clearInterval(localTickerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);

      socket.off('connect', joinRoom);
      socket.emit(SOCKET_EVENTS.CLIENT.ROOM_LEAVE, { roomId });

      socket.off(SOCKET_EVENTS.SERVER.ROOM_STATE, onRoomState);
      socket.off(SOCKET_EVENTS.SERVER.TIMER_STATE, onTimerState);
      socket.off(SOCKET_EVENTS.SERVER.TIMER_TICK, onTimerTick);
      socket.off(SOCKET_EVENTS.SERVER.TIMER_PHASE_CHANGED, onTimerPhaseChanged);
      socket.off(SOCKET_EVENTS.SERVER.ROOM_PARTICIPANT_JOINED, onParticipantJoined);
      socket.off(SOCKET_EVENTS.SERVER.ROOM_PARTICIPANT_LEFT, onParticipantLeft);
      socket.off(SOCKET_EVENTS.SERVER.TASK_CREATED, onTaskCreated);
      socket.off(SOCKET_EVENTS.SERVER.TASK_UPDATED, onTaskUpdated);
      socket.off(SOCKET_EVENTS.SERVER.TASK_DELETED, onTaskDeleted);
      socket.off(SOCKET_EVENTS.SERVER.ROOM_ACTIVITY, onRoomActivity);
      socket.off(SOCKET_EVENTS.SERVER.MEMBER_ROLE_UPDATED, onMemberRoleUpdated);
      socket.off(SOCKET_EVENTS.SERVER.ROOM_ERROR, onRoomError);
      socket.off(SOCKET_EVENTS.SERVER.ROOM_DELETED, onRoomDeleted);
    };
  }, [
    roomId,
    joinRoom,
    setRoomState,
    addMember,
    updateMemberOnlineStatus,
    updateMemberRole,
    addTask,
    updateTask,
    deleteTask,
    addActivity,
    syncAuthoritativeState,
    syncTick,
    localTick,
  ]);

  // Actions wrapped in socket emissions with optimistic response + automatic REST fallback
  const startTimer = () => {
    if (!roomId) return;
    useTimerStore.setState({ status: 'RUNNING' });

    const socket = getSocket();
    let completed = false;

    const applyState = (state: AuthoritativeTimerState) => {
      if (completed) return;
      completed = true;
      syncAuthoritativeState(state);
      broadcastTimerSync(roomId, state);
    };

    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.CLIENT.TIMER_START, { roomId }, (response: any) => {
        if (response?.success && response.data) {
          applyState(response.data);
        } else if (response?.error) {
          toast.error(response.error);
        }
      });
    }

    setTimeout(async () => {
      if (!completed) {
        try {
          const state = await apiRequest<AuthoritativeTimerState>(`/rooms/${roomId}/timer/start`, {
            method: 'POST',
          });
          applyState(state);
        } catch (err: any) {
          if (!completed) {
            toast.error(err.message || 'Failed to start timer');
          }
        }
      }
    }, socket.connected ? 300 : 0);
  };

  const pauseTimer = () => {
    if (!roomId) return;
    useTimerStore.setState({ status: 'PAUSED' });

    const socket = getSocket();
    let completed = false;

    const applyState = (state: AuthoritativeTimerState) => {
      if (completed) return;
      completed = true;
      syncAuthoritativeState(state);
      broadcastTimerSync(roomId, state);
    };

    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.CLIENT.TIMER_PAUSE, { roomId }, (response: any) => {
        if (response?.success && response.data) {
          applyState(response.data);
        } else if (response?.error) {
          toast.error(response.error);
        }
      });
    }

    setTimeout(async () => {
      if (!completed) {
        try {
          const state = await apiRequest<AuthoritativeTimerState>(`/rooms/${roomId}/timer/pause`, {
            method: 'POST',
          });
          applyState(state);
        } catch (err: any) {
          if (!completed) {
            toast.error(err.message || 'Failed to pause timer');
          }
        }
      }
    }, socket.connected ? 300 : 0);
  };

  const resumeTimer = () => {
    if (!roomId) return;
    useTimerStore.setState({ status: 'RUNNING' });

    const socket = getSocket();
    let completed = false;

    const applyState = (state: AuthoritativeTimerState) => {
      if (completed) return;
      completed = true;
      syncAuthoritativeState(state);
      broadcastTimerSync(roomId, state);
    };

    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.CLIENT.TIMER_RESUME, { roomId }, (response: any) => {
        if (response?.success && response.data) {
          applyState(response.data);
        } else if (response?.error) {
          toast.error(response.error);
        }
      });
    }

    setTimeout(async () => {
      if (!completed) {
        try {
          const state = await apiRequest<AuthoritativeTimerState>(`/rooms/${roomId}/timer/resume`, {
            method: 'POST',
          });
          applyState(state);
        } catch (err: any) {
          if (!completed) {
            toast.error(err.message || 'Failed to resume timer');
          }
        }
      }
    }, socket.connected ? 300 : 0);
  };

  const skipPhase = (targetPhase?: string) => {
    if (!roomId) return;
    const socket = getSocket();
    let completed = false;

    const applyState = (state: AuthoritativeTimerState) => {
      if (completed) return;
      completed = true;
      syncAuthoritativeState(state);
      broadcastTimerSync(roomId, state);
    };

    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.CLIENT.TIMER_SKIP, { roomId, targetPhase }, (response: any) => {
        if (response?.success && response.data) {
          applyState(response.data);
        } else if (response?.error) {
          toast.error(response.error);
        }
      });
    }

    setTimeout(async () => {
      if (!completed) {
        try {
          const state = await apiRequest<AuthoritativeTimerState>(`/rooms/${roomId}/timer/skip`, {
            method: 'POST',
            body: JSON.stringify({ targetPhase }),
          });
          applyState(state);
        } catch (err: any) {
          if (!completed) {
            toast.error(err.message || 'Failed to skip phase');
          }
        }
      }
    }, socket.connected ? 300 : 0);
  };

  const emitCreateTask = (taskData: any) => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.TASK_CREATE, { ...taskData, roomId });
  };

  const emitUpdateTask = (taskId: string, updates: any) => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.TASK_UPDATE, { taskId, updates });
  };

  const emitDeleteTask = (taskId: string) => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.TASK_DELETE, { taskId });
  };

  const emitClaimTask = (taskId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const socket = getSocket();
      if (!socket.connected) {
        apiRequest<Task>(`/tasks/${taskId}/claim`, { method: 'POST' })
          .then((task) => {
            updateTask(task);
            toast.success('Task claimed!');
            resolve(true);
          })
          .catch((err) => {
            toast.error(err.message || 'Failed to claim task');
            resolve(false);
          });
        return;
      }

      socket.emit(
        SOCKET_EVENTS.CLIENT.TASK_CLAIM,
        { taskId },
        (response: { success: boolean; data?: Task; error?: string }) => {
          if (response?.success && response.data) {
            updateTask(response.data);
            toast.success('Task claimed!');
            resolve(true);
          } else {
            if (response?.error) {
              toast.error(response.error);
            }
            resolve(false);
          }
        }
      );
    });
  };

  const emitUnassignTask = (taskId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const socket = getSocket();
      if (!socket.connected) {
        apiRequest<Task>(`/tasks/${taskId}/unassign`, { method: 'POST' })
          .then((task) => {
            updateTask(task);
            toast.success('Task unassigned');
            resolve(true);
          })
          .catch((err) => {
            toast.error(err.message || 'Failed to unassign task');
            resolve(false);
          });
        return;
      }

      socket.emit(
        SOCKET_EVENTS.CLIENT.TASK_UNASSIGN,
        { taskId },
        (response: { success: boolean; data?: Task; error?: string }) => {
          if (response?.success && response.data) {
            updateTask(response.data);
            toast.success('Task unassigned');
            resolve(true);
          } else {
            if (response?.error) {
              toast.error(response.error);
            }
            resolve(false);
          }
        }
      );
    });
  };

  const emitChatMessage = (message: string, recipientId?: string) => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.ROOM_CHAT, { roomId, message, recipientId });
  };

  const emitUpdateMemberRole = (targetUserId: string, newRole: RoomRole) => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.MEMBER_ROLE_UPDATE, { roomId, targetUserId, newRole });
  };

  const leaveRoom = useCallback(async () => {
    if (!roomId) return;
    isLeavingRef.current = true;

    if (localTickerRef.current) clearInterval(localTickerRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);

    const socket = getSocket();
    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.CLIENT.ROOM_LEAVE, { roomId });
    }

    await apiRequest(`/rooms/${roomId}/leave`, { method: 'POST' });
  }, [roomId]);

  return {
    startTimer,
    pauseTimer,
    resumeTimer,
    skipPhase,
    createTask: emitCreateTask,
    updateTask: emitUpdateTask,
    deleteTask: emitDeleteTask,
    claimTask: emitClaimTask,
    unassignTask: emitUnassignTask,
    sendChatMessage: emitChatMessage,
    updateMemberRole: emitUpdateMemberRole,
    leaveRoom,
  };
}
