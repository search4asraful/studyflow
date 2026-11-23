import { RoomActivity, SOCKET_EVENTS } from '../shared';
import type { Server as SocketIOServer } from 'socket.io';

/**
 * In-Memory Ephemeral Activity & Chat Manager (Google Meet style)
 *
 * Real-time chat messages and room activities (joins, leaves, timer changes, task updates)
 * are handled purely via Socket.IO events and kept in an ephemeral in-memory ring-buffer
 * during the active session. Zero records are stored in PostgreSQL/Prisma.
 */
export class RoomActivityService {
  private static io: SocketIOServer | null = null;
  // Ephemeral in-memory ring buffer: roomId -> RoomActivity[]
  private static roomActivities = new Map<string, RoomActivity[]>();
  private static readonly MAX_ACTIVITIES_PER_ROOM = 100;

  static setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Retrieve recent ephemeral activities for an active room session
   */
  static getRecentActivities(roomId: string): RoomActivity[] {
    const list = this.roomActivities.get(roomId);
    return list ? [...list] : [];
  }

  /**
   * Broadcast a live activity or chat message to all connected clients in the room
   * and store in the ephemeral in-memory buffer for the active session.
   */
  static broadcastActivity(
    roomId: string,
    activityData: {
      userId: string;
      userName: string;
      action: string;
      details?: string;
    }
  ): RoomActivity {
    const activity: RoomActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      roomId,
      userId: activityData.userId,
      userName: activityData.userName,
      action: activityData.action,
      details: activityData.details,
      createdAt: new Date().toISOString(),
    };

    if (!this.roomActivities.has(roomId)) {
      this.roomActivities.set(roomId, []);
    }
    const list = this.roomActivities.get(roomId)!;
    list.push(activity);
    if (list.length > this.MAX_ACTIVITIES_PER_ROOM) {
      list.shift(); // Keep only recent session activities in memory
    }

    if (this.io) {
      this.io.to(`room:${roomId}`).emit(SOCKET_EVENTS.SERVER.ROOM_ACTIVITY, activity);
    }

    return activity;
  }

  /**
   * Clean up ephemeral in-memory history when room session ends
   */
  static clearRoom(roomId: string) {
    this.roomActivities.delete(roomId);
  }
}
