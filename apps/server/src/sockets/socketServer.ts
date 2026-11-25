import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { parseCookie } from 'cookie';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { TimerService } from '../services/timerService';
import { TaskService } from '../services/taskService';
import { RoomService } from '../services/roomService';
import { RoomActivityService } from '../services/activityMemory';
import { SOCKET_EVENTS, SafeUser } from '../shared';

interface AuthenticatedSocket extends Socket {
  data: {
    user: SafeUser;
    joinedRooms: Set<string>;
  };
}

export function setupSocketServer(httpServer: HttpServer): SocketIOServer {
  const allowedOrigins = [
    env.FRONTEND_URL.replace(/\/$/, ''),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        if (
          allowedOrigins.includes(cleanOrigin) ||
          cleanOrigin.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Attach Socket.IO instance to services
  TimerService.setSocketServer(io);
  TaskService.setSocketServer(io);
  RoomActivityService.setSocketServer(io);

  // Authentication Middleware
  io.use(async (socket: Socket, next) => {
    try {
      let token: string | undefined = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers.cookie) {
        const parsedCookies = parseCookie(socket.handshake.headers.cookie);
        token = parsedCookies.access_token;
      }

      if (!token && socket.handshake.headers.authorization?.startsWith('Bearer ')) {
        token = socket.handshake.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
        },
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.data.user = {
        ...user,
        createdAt: user.createdAt.toISOString(),
      };
      socket.data.joinedRooms = new Set<string>();

      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const user = socket.data.user;

    // Join room
    socket.on(SOCKET_EVENTS.CLIENT.ROOM_JOIN, async (data: { roomId: string }, callback) => {
      try {
        const { roomId } = data;
        if (!roomId) return;

        // Verify or auto-join member
        const roomDetails = await RoomService.getRoomDetails(roomId, user.id);

        socket.join(`room:${roomId}`);
        socket.data.joinedRooms.add(roomId);

        TimerService.registerParticipant(roomId, user.id);

        // Update lastActiveAt
        await prisma.roomMember.updateMany({
          where: { roomId, userId: user.id },
          data: { lastActiveAt: new Date() },
        });

        // Notify other participants
        socket.to(`room:${roomId}`).emit(SOCKET_EVENTS.SERVER.ROOM_PARTICIPANT_JOINED, {
          user,
          roomId,
          timestamp: new Date().toISOString(),
        });

        // Broadcast live ephemeral participant join activity
        RoomActivityService.broadcastActivity(roomId, {
          userId: user.id,
          userName: user.name,
          action: 'MEMBER_JOINED',
          details: `${user.name} joined the room`,
        });

        // Send full authoritative room state back to the joiner
        if (typeof callback === 'function') {
          callback({ success: true, data: roomDetails });
        } else {
          socket.emit(SOCKET_EVENTS.SERVER.ROOM_STATE, roomDetails);
        }
      } catch (error: any) {
        socket.emit(SOCKET_EVENTS.SERVER.ROOM_ERROR, {
          message: error.message || 'Failed to join room',
        });
        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    // Leave room
    socket.on(SOCKET_EVENTS.CLIENT.ROOM_LEAVE, async (data: { roomId: string }) => {
      try {
        const { roomId } = data;
        if (!roomId) return;

        socket.leave(`room:${roomId}`);
        socket.data.joinedRooms.delete(roomId);
        TimerService.unregisterParticipant(roomId, user.id);

        socket.to(`room:${roomId}`).emit(SOCKET_EVENTS.SERVER.ROOM_PARTICIPANT_LEFT, {
          userId: user.id,
          userName: user.name,
          roomId,
        });

        // Broadcast live ephemeral participant leave activity
        RoomActivityService.broadcastActivity(roomId, {
          userId: user.id,
          userName: user.name,
          action: 'MEMBER_LEFT',
          details: `${user.name} left the room`,
        });

        if (TimerService.getActiveParticipants(roomId).length === 0) {
          RoomActivityService.clearRoom(roomId);
        }
      } catch {
        // Silently handled without console exposure
      }
    });

    // Timer controls
    socket.on(SOCKET_EVENTS.CLIENT.TIMER_START, async (data: { roomId: string }, callback) => {
      try {
        const state = await TimerService.startTimer(data.roomId, user.id);
        if (typeof callback === 'function') callback({ success: true, data: state });
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.SERVER.ROOM_ERROR, { message: err.message });
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on(SOCKET_EVENTS.CLIENT.TIMER_PAUSE, async (data: { roomId: string }, callback) => {
      try {
        const state = await TimerService.pauseTimer(data.roomId, user.id);
        if (typeof callback === 'function') callback({ success: true, data: state });
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.SERVER.ROOM_ERROR, { message: err.message });
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on(SOCKET_EVENTS.CLIENT.TIMER_RESUME, async (data: { roomId: string }, callback) => {
      try {
        const state = await TimerService.resumeTimer(data.roomId, user.id);
        if (typeof callback === 'function') callback({ success: true, data: state });
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.SERVER.ROOM_ERROR, { message: err.message });
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on(
      SOCKET_EVENTS.CLIENT.TIMER_SKIP,
      async (data: { roomId: string; targetPhase?: any }, callback) => {
        try {
          const state = await TimerService.skipPhase(data.roomId, user.id, data.targetPhase);
          if (typeof callback === 'function') callback({ success: true, data: state });
        } catch (err: any) {
          socket.emit(SOCKET_EVENTS.SERVER.ROOM_ERROR, { message: err.message });
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      }
    );

    // Collaborative Task events
    socket.on(SOCKET_EVENTS.CLIENT.TASK_CREATE, async (data: any, callback) => {
      try {
        const task = await TaskService.createTask(user.id, data);
        if (typeof callback === 'function') callback({ success: true, data: task });
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.SERVER.ROOM_ERROR, { message: err.message });
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on(
      SOCKET_EVENTS.CLIENT.TASK_UPDATE,
      async (data: { taskId: string; updates: any }, callback) => {
        try {
          const task = await TaskService.updateTask(data.taskId, user.id, data.updates);
          if (typeof callback === 'function') callback({ success: true, data: task });
        } catch (err: any) {
          socket.emit(SOCKET_EVENTS.SERVER.ROOM_ERROR, { message: err.message });
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      }
    );

    socket.on(SOCKET_EVENTS.CLIENT.TASK_DELETE, async (data: { taskId: string }, callback) => {
      try {
        await TaskService.deleteTask(data.taskId, user.id);
        if (typeof callback === 'function') callback({ success: true });
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.SERVER.ROOM_ERROR, { message: err.message });
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on(SOCKET_EVENTS.CLIENT.TASK_CLAIM, async (data: { taskId: string }, callback) => {
      try {
        const task = await TaskService.claimTask(data.taskId, user.id);
        if (typeof callback === 'function') callback({ success: true, data: task });
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        } else {
          socket.emit(SOCKET_EVENTS.SERVER.ROOM_ERROR, { message: err.message });
        }
      }
    });

    socket.on(SOCKET_EVENTS.CLIENT.TASK_UNASSIGN, async (data: { taskId: string }, callback) => {
      try {
        const task = await TaskService.unassignTask(data.taskId, user.id);
        if (typeof callback === 'function') callback({ success: true, data: task });
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        } else {
          socket.emit(SOCKET_EVENTS.SERVER.ROOM_ERROR, { message: err.message });
        }
      }
    });

    // Member role update (promote / demote / transfer host)
    socket.on(
      SOCKET_EVENTS.CLIENT.MEMBER_ROLE_UPDATE,
      async (data: { roomId: string; targetUserId: string; newRole: any }, callback) => {
        try {
          const { roomId, targetUserId, newRole } = data;
          if (!roomId || !targetUserId || !newRole) {
            throw new Error('Room ID, target user ID, and new role are required');
          }

          const result = await RoomService.updateMemberRole(roomId, targetUserId, newRole, user.id);

          const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { name: true },
          });
          const targetName = targetUser?.name || 'Member';

          const roleLabels: Record<string, string> = {
            OWNER: 'Room Host',
            MODERATOR: 'Moderator',
            MEMBER: 'Study Mate',
          };
          const newLabel = roleLabels[newRole] || newRole;

          // Broadcast to all participants in this room
          io.to(`room:${roomId}`).emit(SOCKET_EVENTS.SERVER.MEMBER_ROLE_UPDATED, {
            roomId,
            targetUserId,
            newRole,
            previousRole: result.previousRole,
            newOwnerId: result.newOwnerId,
            updatedByUserId: user.id,
          });

          // Activity announcement
          const actionText =
            newRole === 'OWNER'
              ? `${user.name} transferred Room Host to ${targetName}`
              : result.previousRole === 'MEMBER' && newRole === 'MODERATOR'
              ? `${user.name} promoted ${targetName} to Moderator`
              : result.previousRole === 'MODERATOR' && newRole === 'MEMBER'
              ? `${user.name} demoted ${targetName} to Study Mate`
              : `${user.name} updated ${targetName}'s role to ${newLabel}`;

          RoomActivityService.broadcastActivity(roomId, {
            userId: user.id,
            userName: user.name,
            action: 'MEMBER_ROLE_UPDATED',
            details: actionText,
          });

          if (typeof callback === 'function') callback({ success: true, data: result });
        } catch (err: any) {
          socket.emit(SOCKET_EVENTS.SERVER.ROOM_ERROR, { message: err.message });
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      }
    );

    // Participant heartbeat
    socket.on(SOCKET_EVENTS.CLIENT.PARTICIPANT_HEARTBEAT, async (data: { roomId: string }) => {
      if (data?.roomId && socket.data.joinedRooms.has(data.roomId)) {
        TimerService.registerParticipant(data.roomId, user.id);
        await prisma.roomMember.updateMany({
          where: { roomId: data.roomId, userId: user.id },
          data: { lastActiveAt: new Date() },
        });
      }
    });

    // Room real-time activity/chat (handled entirely in-memory via socket, zero database writes)
    socket.on(SOCKET_EVENTS.CLIENT.ROOM_CHAT, async (data: { roomId: string; message: string; recipientId?: string }) => {
      if (!data?.roomId || !data?.message?.trim()) return;
      if (!socket.data.joinedRooms.has(data.roomId)) {
        return;
      }

      if (data.recipientId) {
        // Direct private message between two meeting participants
        const directActivity = {
          id: `dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          roomId: data.roomId,
          userId: user.id,
          userName: user.name,
          action: 'DIRECT_CHAT',
          details: data.message.trim(),
          recipientId: data.recipientId,
          createdAt: new Date().toISOString(),
        };

        const activeSockets = await io.in(`room:${data.roomId}`).fetchSockets();
        for (const s of activeSockets) {
          const clientSock = s as unknown as AuthenticatedSocket;
          if (clientSock.data?.user?.id === data.recipientId || clientSock.data?.user?.id === user.id) {
            clientSock.emit(SOCKET_EVENTS.SERVER.ROOM_ACTIVITY, directActivity);
          }
        }
      } else {
        // Broadcast group chat message to active room participants
        RoomActivityService.broadcastActivity(data.roomId, {
          userId: user.id,
          userName: user.name,
          action: 'CHAT_MESSAGE',
          details: data.message.trim(),
        });
      }
    });

    // Real-time latency measurement ping
    socket.on('studyflow:ping', (callback) => {
      if (typeof callback === 'function') {
        callback({ ok: true, timestamp: Date.now() });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      for (const roomId of socket.data.joinedRooms) {
        TimerService.unregisterParticipant(roomId, user.id);
        socket.to(`room:${roomId}`).emit(SOCKET_EVENTS.SERVER.ROOM_PARTICIPANT_LEFT, {
          userId: user.id,
          userName: user.name,
          roomId,
        });

        // Broadcast live ephemeral participant leave activity
        RoomActivityService.broadcastActivity(roomId, {
          userId: user.id,
          userName: user.name,
          action: 'MEMBER_LEFT',
          details: `${user.name} left the room`,
        });

        if (TimerService.getActiveParticipants(roomId).length === 0) {
          RoomActivityService.clearRoom(roomId);
        }
      }
    });
  });

  return io;
}
