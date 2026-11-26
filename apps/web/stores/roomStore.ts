import { create } from 'zustand';
import {
  StudyRoom,
  RoomMember,
  Task,
  RoomActivity,
  RoomRole,
  SafeUser,
  RoomStatePayload,
} from '@studyflow/shared';

interface RoomState {
  room: StudyRoom | null;
  role: RoomRole | null;
  members: RoomMember[];
  tasks: Task[];
  activities: RoomActivity[];
  isLoading: boolean;
  error: string | null;

  setRoomState: (payload: RoomStatePayload) => void;
  updateMemberOnlineStatus: (userId: string, isOnline: boolean) => void;
  addMember: (user: SafeUser) => void;
  removeMember: (userId: string) => void;
  updateMemberRole: (
    targetUserId: string,
    newRole: RoomRole,
    newOwnerId?: string,
    currentUserId?: string
  ) => void;
  
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  
  addActivity: (activity: RoomActivity) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  role: null,
  members: [],
  tasks: [],
  activities: [],
  isLoading: true,
  error: null,

  setRoomState: (payload) => {
    // Sort activities chronologically (oldest at top, newest at bottom)
    const sortedActivities = [...(payload.recentActivities || [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return set({
      room: payload.room,
      role: payload.role,
      members: payload.members,
      tasks: payload.tasks,
      activities: sortedActivities,
      isLoading: false,
      error: null,
    });
  },

  updateMemberOnlineStatus: (userId, isOnline) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.userId === userId ? { ...m, isOnline, lastActiveAt: new Date().toISOString() } : m
      ),
    })),

  addMember: (user) =>
    set((state) => {
      if (state.members.some((m) => m.userId === user.id)) return state;
      const newMember: RoomMember = {
        id: `mem_${Date.now()}`,
        roomId: state.room?.id || '',
        userId: user.id,
        role: 'MEMBER',
        user,
        joinedAt: new Date().toISOString(),
        isOnline: true,
      };
      return {
        members: [...state.members, newMember],
      };
    }),

  removeMember: (userId) =>
    set((state) => ({
      members: state.members.filter((m) => m.userId !== userId),
    })),

  updateMemberRole: (targetUserId, newRole, newOwnerId, currentUserId) =>
    set((state) => {
      const updatedMembers = state.members.map((m) => {
        if (m.userId === targetUserId) {
          return { ...m, role: newRole };
        }
        if (newRole === 'OWNER' && m.role === 'OWNER' && m.userId !== targetUserId) {
          return { ...m, role: 'MODERATOR' as RoomRole };
        }
        return m;
      });

      let updatedRole = state.role;
      if (currentUserId) {
        if (targetUserId === currentUserId) {
          updatedRole = newRole;
        } else if (newRole === 'OWNER' && state.role === 'OWNER') {
          updatedRole = 'MODERATOR';
        }
      }

      let updatedRoom = state.room;
      if (newOwnerId && state.room) {
        updatedRoom = { ...state.room, ownerId: newOwnerId };
      }

      return {
        members: updatedMembers,
        role: updatedRole,
        room: updatedRoom,
      };
    }),

  addTask: (task) =>
    set((state) => {
      // Avoid duplicates
      if (state.tasks.some((t) => t.id === task.id)) return state;
      return { tasks: [task, ...state.tasks] };
    }),

  updateTask: (updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    })),

  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    })),

  addActivity: (activity) =>
    set((state) => {
      // Deduplicate by ID
      if (state.activities.some((a) => a.id === activity.id)) return state;

      // Deduplicate near-identical recent system/task activity from same user within 5 seconds
      const isDuplicate = state.activities.some((a) => {
        if (
          a.action !== 'CHAT_MESSAGE' &&
          a.action !== 'DIRECT_CHAT' &&
          a.userId === activity.userId
        ) {
          const timeDiff = Math.abs(
            new Date(a.createdAt).getTime() - new Date(activity.createdAt).getTime()
          );
          if (timeDiff < 5000) {
            if (a.details === activity.details) return true;
            if (
              a.details &&
              activity.details &&
              (a.details.includes(activity.details) || activity.details.includes(a.details))
            ) {
              return true;
            }
          }
        }
        return false;
      });
      if (isDuplicate) return state;

      return {
        // Append newest message to the bottom
        activities: [...state.activities.slice(-60), activity],
      };
    }),

  setError: (error) => set({ error, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  clearRoom: () =>
    set({
      room: null,
      role: null,
      members: [],
      tasks: [],
      activities: [],
      isLoading: true,
      error: null,
    }),
}));
