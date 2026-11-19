import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { setupSocketServer } from '../sockets/socketServer';
import { prisma } from '../config/prisma';
import { AuthService } from '../services/authService';
import { SOCKET_EVENTS } from '../shared';

describe('Multi-Client Real-Time Concurrency & Synchronization', () => {
  let server: http.Server;
  let serverPort: number;
  let tokenAsraful: string;
  let tokenShakil: string;
  let clientAsraful: ClientSocket;
  let clientShakil: ClientSocket;
  let testRoomId: string;

  beforeAll(async () => {
    // 1. Start test HTTP & Socket server
    const app = express();
    server = http.createServer(app);
    setupSocketServer(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        serverPort = typeof addr === 'object' && addr ? addr.port : 4001;
        resolve();
      });
    });

    // 2. Fetch or prepare test users
    const userA = await prisma.user.findUnique({ where: { email: 'asraful@studyflow.dev' } });
    const userB = await prisma.user.findUnique({ where: { email: 'shakil@studyflow.dev' } });

    tokenAsraful = AuthService.createToken(userA!.id, userA!.email);
    tokenShakil = AuthService.createToken(userB!.id, userB!.email);

    const room = await prisma.studyRoom.findUnique({ where: { inviteCode: 'SD3ASTRO' } });
    testRoomId = room!.id;
  });

  afterAll(async () => {
    clientAsraful?.disconnect();
    clientShakil?.disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('connects two distinct authenticated clients simultaneously', async () => {
    clientAsraful = Client(`http://localhost:${serverPort}`, {
      auth: { token: tokenAsraful },
      transports: ['websocket'],
    });

    clientShakil = Client(`http://localhost:${serverPort}`, {
      auth: { token: tokenShakil },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise<void>((resolve) => clientAsraful.on('connect', resolve)),
      new Promise<void>((resolve) => clientShakil.on('connect', resolve)),
    ]);

    expect(clientAsraful.connected).toBe(true);
    expect(clientShakil.connected).toBe(true);
    expect(clientAsraful.id).not.toBe(clientShakil.id);
  });

  it('notifies client when another participant joins the study room', async () => {
    // Shakil joins first
    await new Promise<void>((resolve) => {
      clientShakil.emit(SOCKET_EVENTS.CLIENT.ROOM_JOIN, { roomId: testRoomId }, () => {
        resolve();
      });
    });

    // Asraful joins; Shakil should receive participant joined event
    const participantJoinedPromise = new Promise<any>((resolve) => {
      clientShakil.once(SOCKET_EVENTS.SERVER.ROOM_PARTICIPANT_JOINED, (data) => {
        resolve(data);
      });
    });

    clientAsraful.emit(SOCKET_EVENTS.CLIENT.ROOM_JOIN, { roomId: testRoomId });

    const joinedData = await participantJoinedPromise;
    expect(joinedData.roomId).toBe(testRoomId);
    expect(joinedData.user.email).toBe('asraful@studyflow.dev');
  });

  it('synchronizes timer start authoritatively across both connected clients', async () => {
    // Both clients listen for TIMER_STATE
    const asrafulReceivedPromise = new Promise<any>((resolve) => {
      clientAsraful.once(SOCKET_EVENTS.SERVER.TIMER_STATE, resolve);
    });
    const shakilReceivedPromise = new Promise<any>((resolve) => {
      clientShakil.once(SOCKET_EVENTS.SERVER.TIMER_STATE, resolve);
    });

    // Room owner (Asraful) starts timer
    clientAsraful.emit(SOCKET_EVENTS.CLIENT.TIMER_START, { roomId: testRoomId });

    const [stateA, stateB] = await Promise.all([asrafulReceivedPromise, shakilReceivedPromise]);

    expect(stateA.status).toBe('RUNNING');
    expect(stateB.status).toBe('RUNNING');
    expect(stateA.roomId).toBe(testRoomId);
    expect(stateB.roomId).toBe(testRoomId);
    expect(stateA.phase).toBe(stateB.phase);
    expect(stateA.remainingSeconds).toBe(stateB.remainingSeconds);
  });

  it('broadcasts task creation instantly to other participants', async () => {
    const taskTitle = `Concurrency Test Task ${Date.now()}`;

    const asrafulTaskReceivedPromise = new Promise<any>((resolve) => {
      clientAsraful.once(SOCKET_EVENTS.SERVER.TASK_CREATED, resolve);
    });

    // Shakil creates task
    clientShakil.emit(SOCKET_EVENTS.CLIENT.TASK_CREATE, {
      roomId: testRoomId,
      title: taskTitle,
      priority: 'HIGH',
      status: 'TODO',
    });

    const receivedTask = await asrafulTaskReceivedPromise;
    expect(receivedTask.title).toBe(taskTitle);
    expect(receivedTask.roomId).toBe(testRoomId);
    expect(receivedTask.status).toBe('TODO');
  });
});
