import { describe, it, expect, beforeEach } from 'vitest';
import { RoomActivityService } from '../services/activityMemory';
import { prisma } from '../config/prisma';

describe('Ephemeral Socket-Only Chat & Activity Service (Google Meet Architecture)', () => {
  const testRoomId = 'test-room-socket-123';

  beforeEach(() => {
    RoomActivityService.clearRoom(testRoomId);
  });

  it('verifies that Prisma has no roomActivity or taskActivity models in database', () => {
    // Assert that roomActivity and taskActivity are not on prisma client instance
    expect((prisma as any).roomActivity).toBeUndefined();
    expect((prisma as any).taskActivity).toBeUndefined();
  });

  it('broadcasts chat messages ephemerally in-memory without database storage', () => {
    const activity = RoomActivityService.broadcastActivity(testRoomId, {
      userId: 'user-1',
      userName: 'Alice',
      action: 'CHAT_MESSAGE',
      details: 'Hello meeting team! Live in-memory only.',
    });

    expect(activity.id).toBeDefined();
    expect(activity.roomId).toBe(testRoomId);
    expect(activity.userId).toBe('user-1');
    expect(activity.userName).toBe('Alice');
    expect(activity.action).toBe('CHAT_MESSAGE');
    expect(activity.details).toBe('Hello meeting team! Live in-memory only.');

    const inMemoryList = RoomActivityService.getRecentActivities(testRoomId);
    expect(inMemoryList.length).toBe(1);
    expect(inMemoryList[0].details).toBe('Hello meeting team! Live in-memory only.');
  });

  it('broadcasts real-time meeting events (joins, timer changes, tasks)', () => {
    RoomActivityService.broadcastActivity(testRoomId, {
      userId: 'user-2',
      userName: 'Bob',
      action: 'MEMBER_JOINED',
      details: 'Bob joined the room',
    });

    RoomActivityService.broadcastActivity(testRoomId, {
      userId: 'user-1',
      userName: 'Alice',
      action: 'TIMER_STARTED',
      details: 'Started FOCUS session',
    });

    RoomActivityService.broadcastActivity(testRoomId, {
      userId: 'user-2',
      userName: 'Bob',
      action: 'TASK_CREATED',
      details: 'Bob added task: "Implement WebRTC audio"',
    });

    const activities = RoomActivityService.getRecentActivities(testRoomId);
    expect(activities.length).toBe(3);
    expect(activities[0].action).toBe('MEMBER_JOINED');
    expect(activities[1].action).toBe('TIMER_STARTED');
    expect(activities[2].action).toBe('TASK_CREATED');
  });

  it('clears ephemeral in-memory activities when room session ends', () => {
    RoomActivityService.broadcastActivity(testRoomId, {
      userId: 'user-1',
      userName: 'Alice',
      action: 'CHAT_MESSAGE',
      details: 'Ephemeral message',
    });

    expect(RoomActivityService.getRecentActivities(testRoomId).length).toBe(1);

    // When all participants leave, room is cleared
    RoomActivityService.clearRoom(testRoomId);
    expect(RoomActivityService.getRecentActivities(testRoomId).length).toBe(0);
  });

  it('enforces ring-buffer bounds to prevent memory leaks during long-running sessions', () => {
    for (let i = 0; i < 120; i++) {
      RoomActivityService.broadcastActivity(testRoomId, {
        userId: `user-${i}`,
        userName: `User ${i}`,
        action: 'CHAT_MESSAGE',
        details: `Message #${i}`,
      });
    }

    const activities = RoomActivityService.getRecentActivities(testRoomId);
    expect(activities.length).toBe(100);
    // Oldest messages were rotated out, newest message is preserved
    expect(activities[activities.length - 1].details).toBe('Message #119');
  });
});
