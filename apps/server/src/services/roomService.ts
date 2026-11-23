import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { RoomRole, TimerPhase, TimerStatus } from '@prisma/client';
import {
  CreateRoomInput,
  UpdateRoomInput,
  StudyRoom,
  RoomStatePayload,
} from '../shared';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { TimerService } from './timerService';
import { RoomActivityService } from './activityMemory';

export class RoomService {
  private static generateInviteCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 characters
  }

  static async createRoom(userId: string, input: CreateRoomInput): Promise<StudyRoom> {
    let inviteCode = this.generateInviteCode();

    // Ensure uniqueness
    while (await prisma.studyRoom.findUnique({ where: { inviteCode } })) {
      inviteCode = this.generateInviteCode();
    }

    const room = await prisma.studyRoom.create({
      data: {
        name: input.name,
        description: input.description,
        isPrivate: input.isPrivate ?? false,
        focusDuration: input.focusDuration ?? 25 * 60,
        shortBreakDuration: input.shortBreakDuration ?? 5 * 60,
        longBreakDuration: input.longBreakDuration ?? 15 * 60,
        cyclesBeforeLongBreak: input.cyclesBeforeLongBreak ?? 4,
        inviteCode,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: RoomRole.OWNER,
          },
        },
        timerState: {
          create: {
            phase: TimerPhase.FOCUS,
            status: TimerStatus.IDLE,
            remainingSeconds: input.focusDuration ?? 25 * 60,
            totalPhaseDuration: input.focusDuration ?? 25 * 60,
            currentCycle: 1,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      inviteCode: room.inviteCode,
      isPrivate: room.isPrivate,
      focusDuration: room.focusDuration,
      shortBreakDuration: room.shortBreakDuration,
      longBreakDuration: room.longBreakDuration,
      cyclesBeforeLongBreak: room.cyclesBeforeLongBreak,
      ownerId: room.ownerId,
      owner: {
        ...room.owner,
        createdAt: room.owner.createdAt.toISOString(),
      },
      memberCount: room._count.members,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    };
  }

  static async getRoomsForUser(userId: string): Promise<StudyRoom[]> {
    const rooms = await prisma.studyRoom.findMany({
      where: {
        OR: [
          { members: { some: { userId } } },
          { isPrivate: false },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rooms.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      inviteCode: r.inviteCode,
      isPrivate: r.isPrivate,
      focusDuration: r.focusDuration,
      shortBreakDuration: r.shortBreakDuration,
      longBreakDuration: r.longBreakDuration,
      cyclesBeforeLongBreak: r.cyclesBeforeLongBreak,
      ownerId: r.ownerId,
      owner: {
        ...r.owner,
        createdAt: r.owner.createdAt.toISOString(),
      },
      memberCount: r._count.members,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  static async getRoomDetails(roomId: string, userId: string): Promise<RoomStatePayload> {
    const room = await prisma.studyRoom.findUnique({
      where: { id: roomId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                bio: true,
                createdAt: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        tasks: {
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                bio: true,
                createdAt: true,
              },
            },
            assignee: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                bio: true,
                createdAt: true,
              },
            },
          },
          orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Study room not found');
    }

    // Verify membership
    let member = room.members.find((m) => m.userId === userId);
    if (!member && !room.isPrivate) {
      // Auto-join if public room
      const newMember = await prisma.roomMember.create({
        data: {
          roomId,
          userId,
          role: RoomRole.MEMBER,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
              bio: true,
              createdAt: true,
            },
          },
        },
      });
      room.members.push(newMember as any);
      member = newMember as any;
    } else if (!member) {
      throw new ForbiddenError('You are not a member of this private room');
    }

    const timerState = await TimerService.getAuthoritativeState(roomId);
    const activeParticipants = TimerService.getActiveParticipants(roomId);

    return {
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        inviteCode: room.inviteCode,
        isPrivate: room.isPrivate,
        focusDuration: room.focusDuration,
        shortBreakDuration: room.shortBreakDuration,
        longBreakDuration: room.longBreakDuration,
        cyclesBeforeLongBreak: room.cyclesBeforeLongBreak,
        ownerId: room.ownerId,
        owner: {
          ...room.owner,
          createdAt: room.owner.createdAt.toISOString(),
        },
        memberCount: room.members.length,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
      },
      role: member ? (member.role as any) : 'MEMBER',
      members: room.members.map((m) => ({
        id: m.id,
        roomId: m.roomId,
        userId: m.userId,
        role: m.role as any,
        user: {
          ...m.user,
          createdAt: m.user.createdAt.toISOString(),
        },
        joinedAt: m.joinedAt.toISOString(),
        lastActiveAt: m.lastActiveAt.toISOString(),
        isOnline: activeParticipants.includes(m.userId),
      })),
      timerState,
      tasks: room.tasks.map((t) => ({
        id: t.id,
        roomId: t.roomId,
        title: t.title,
        description: t.description,
        status: t.status as any,
        priority: t.priority as any,
        assigneeId: t.assigneeId,
        assignee: t.assignee
          ? {
              ...t.assignee,
              createdAt: t.assignee.createdAt.toISOString(),
            }
          : null,
        createdById: t.createdById,
        createdBy: {
          ...t.createdBy,
          createdAt: t.createdBy.createdAt.toISOString(),
        },
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        position: t.position,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      recentActivities: RoomActivityService.getRecentActivities(roomId),
    };
  }

  static async joinRoomByCode(userId: string, inviteCode: string): Promise<StudyRoom> {
    const room = await prisma.studyRoom.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
          },
        },
        _count: { select: { members: true } },
      },
    });

    if (!room) {
      throw new NotFoundError('Invalid invite code');
    }

    const existingMember = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: { roomId: room.id, userId },
      },
    });

    if (!existingMember) {
      await prisma.roomMember.create({
        data: {
          roomId: room.id,
          userId,
          role: RoomRole.MEMBER,
        },
      });
    }

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      inviteCode: room.inviteCode,
      isPrivate: room.isPrivate,
      focusDuration: room.focusDuration,
      shortBreakDuration: room.shortBreakDuration,
      longBreakDuration: room.longBreakDuration,
      cyclesBeforeLongBreak: room.cyclesBeforeLongBreak,
      ownerId: room.ownerId,
      owner: {
        ...room.owner,
        createdAt: room.owner.createdAt.toISOString(),
      },
      memberCount: room._count.members + (existingMember ? 0 : 1),
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    };
  }

  static async leaveRoom(roomId: string, userId: string): Promise<void> {
    const room = await prisma.studyRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundError('Room not found');

    if (room.ownerId === userId) {
      throw new BadRequestError(
        'Room owners cannot leave their own room. Transfer ownership or delete the room.'
      );
    }

    await prisma.roomMember.delete({
      where: {
        roomId_userId: { roomId, userId },
      },
    });
  }

  static async updateRoom(
    roomId: string,
    userId: string,
    input: UpdateRoomInput
  ): Promise<StudyRoom> {
    const room = await prisma.studyRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundError('Room not found');

    if (room.ownerId !== userId) {
      throw new ForbiddenError('Only the room owner can update room settings');
    }

    const updated = await prisma.studyRoom.update({
      where: { id: roomId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.isPrivate !== undefined ? { isPrivate: input.isPrivate } : {}),
        ...(input.focusDuration ? { focusDuration: input.focusDuration } : {}),
        ...(input.shortBreakDuration ? { shortBreakDuration: input.shortBreakDuration } : {}),
        ...(input.longBreakDuration ? { longBreakDuration: input.longBreakDuration } : {}),
        ...(input.cyclesBeforeLongBreak ? { cyclesBeforeLongBreak: input.cyclesBeforeLongBreak } : {}),
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
          },
        },
        _count: { select: { members: true } },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      inviteCode: updated.inviteCode,
      isPrivate: updated.isPrivate,
      focusDuration: updated.focusDuration,
      shortBreakDuration: updated.shortBreakDuration,
      longBreakDuration: updated.longBreakDuration,
      cyclesBeforeLongBreak: updated.cyclesBeforeLongBreak,
      ownerId: updated.ownerId,
      owner: {
        ...updated.owner,
        createdAt: updated.owner.createdAt.toISOString(),
      },
      memberCount: updated._count.members,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  static async deleteRoom(roomId: string, userId: string): Promise<void> {
    const room = await prisma.studyRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundError('Room not found');

    if (room.ownerId !== userId) {
      throw new ForbiddenError('Only the room owner can delete the room');
    }

    await prisma.studyRoom.delete({
      where: { id: roomId },
    });
    RoomActivityService.clearRoom(roomId);
  }

  static async updateMemberRole(
    roomId: string,
    targetUserId: string,
    newRole: RoomRole,
    requestingUserId: string
  ): Promise<void> {
    const room = await prisma.studyRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundError('Room not found');

    if (room.ownerId !== requestingUserId) {
      throw new ForbiddenError('Only the room owner can manage roles');
    }

    if (targetUserId === room.ownerId) {
      throw new BadRequestError('Cannot change the owner role');
    }

    await prisma.roomMember.update({
      where: {
        roomId_userId: { roomId, userId: targetUserId },
      },
      data: { role: newRole },
    });
  }

  static async kickMember(
    roomId: string,
    targetUserId: string,
    requestingUserId: string
  ): Promise<void> {
    const room = await prisma.studyRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundError('Room not found');

    const requesterMember = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: requestingUserId } },
    });

    if (!requesterMember || requesterMember.role === RoomRole.MEMBER) {
      throw new ForbiddenError('Only owner and moderators can remove members');
    }

    if (targetUserId === room.ownerId) {
      throw new BadRequestError('Cannot kick the room owner');
    }

    await prisma.roomMember.delete({
      where: {
        roomId_userId: { roomId, userId: targetUserId },
      },
    });
  }
}
