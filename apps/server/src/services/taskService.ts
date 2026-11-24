import { prisma } from '../config/prisma';
import { CreateTaskInput, UpdateTaskInput, Task, SOCKET_EVENTS } from '../shared';
import { ForbiddenError, NotFoundError, ConflictError } from '../utils/errors';
import { RoomActivityService } from './activityMemory';
import { RoomRole, TaskStatus } from '@prisma/client';
import type { Server as SocketIOServer } from 'socket.io';

export class TaskService {
  private static io: SocketIOServer | null = null;

  static setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  private static formatTask(t: any): Task {
    return {
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
      createdBy: t.createdBy
        ? {
            ...t.createdBy,
            createdAt: t.createdBy.createdAt.toISOString(),
          }
        : undefined,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      position: t.position,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  static async createTask(userId: string, input: CreateTaskInput): Promise<Task> {
    // Assert room membership
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: { roomId: input.roomId, userId },
      },
      include: { user: true },
    });

    if (!membership) {
      throw new ForbiddenError('You must be a member of this room to create tasks');
    }

    const task = await prisma.task.create({
      data: {
        roomId: input.roomId,
        title: input.title,
        description: input.description,
        status: input.status as TaskStatus,
        priority: input.priority as any,
        assigneeId: input.assigneeId || null,
        createdById: userId,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        position: input.position ?? 0,
      },
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
    });

    // Broadcast live ephemeral room activity via socket (zero database writes)
    RoomActivityService.broadcastActivity(input.roomId, {
      userId,
      userName: membership.user.name,
      action: 'TASK_CREATED',
      details: `${membership.user.name} added task: "${task.title}"`,
    });

    const formatted = this.formatTask(task);

    // Broadcast to room via Socket.IO
    if (this.io) {
      this.io.to(`room:${input.roomId}`).emit(SOCKET_EVENTS.SERVER.TASK_CREATED, formatted);
    }

    return formatted;
  }

  static async updateTask(
    taskId: string,
    userId: string,
    input: UpdateTaskInput
  ): Promise<Task> {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { room: { include: { members: true } } },
    });

    if (!existing) {
      throw new NotFoundError('Task not found');
    }

    // Must be room member
    const userMember = existing.room.members.find((m) => m.userId === userId);
    if (!userMember) {
      throw new ForbiddenError('You are not a member of this room');
    }

    const canManage =
      existing.createdById === userId ||
      userMember.role === RoomRole.OWNER ||
      userMember.role === RoomRole.MODERATOR;

    if (!canManage) {
      throw new ForbiddenError(
        'Only the task creator, room host, or moderator can edit or move this task'
      );
    }

    const oldStatus = existing.status;
    const oldAssigneeId = existing.assigneeId;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status ? { status: input.status as TaskStatus } : {}),
        ...(input.priority ? { priority: input.priority as any } : {}),
        ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
        ...(input.dueDate !== undefined
          ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
          : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
      },
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
    });

    // Check if status changed
    if (input.status && input.status !== oldStatus) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      RoomActivityService.broadcastActivity(existing.roomId, {
        userId,
        userName: user?.name || 'Member',
        action: input.status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED',
        details: `${user?.name || 'Member'} moved "${updated.title}" to ${input.status.replace('_', ' ')}`,
      });
    } else if (input.title || input.description || input.priority) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      RoomActivityService.broadcastActivity(existing.roomId, {
        userId,
        userName: user?.name || 'Member',
        action: 'TASK_UPDATED',
        details: `${user?.name || 'Member'} updated task "${updated.title}"`,
      });
    }

    // Check if assignee changed
    if (input.assigneeId !== undefined && input.assigneeId !== oldAssigneeId && input.assigneeId) {
      await prisma.notification.create({
        data: {
          userId: input.assigneeId,
          title: 'New Task Assigned',
          message: `You were assigned to task: "${updated.title}"`,
          type: 'TASK_ASSIGNED',
        },
      });
    }

    const formatted = this.formatTask(updated);

    // Broadcast to room via Socket.IO
    if (this.io) {
      this.io.to(`room:${existing.roomId}`).emit(SOCKET_EVENTS.SERVER.TASK_UPDATED, formatted);
    }

    return formatted;
  }

  static async deleteTask(taskId: string, userId: string): Promise<void> {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { room: { include: { members: true } } },
    });

    if (!existing) {
      throw new NotFoundError('Task not found');
    }

    // Can delete if creator OR room owner OR moderator
    const userMember = existing.room.members.find((m) => m.userId === userId);
    if (!userMember) {
      throw new ForbiddenError('You are not a member of this room');
    }

    const canDelete =
      existing.createdById === userId ||
      userMember.role === RoomRole.OWNER ||
      userMember.role === RoomRole.MODERATOR;

    if (!canDelete) {
      throw new ForbiddenError('Insufficient permissions to delete this task');
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    // Broadcast deletion and activity via socket
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    RoomActivityService.broadcastActivity(existing.roomId, {
      userId,
      userName: user?.name || 'Member',
      action: 'TASK_DELETED',
      details: `${user?.name || 'Member'} deleted task "${existing.title}"`,
    });

    if (this.io) {
      this.io.to(`room:${existing.roomId}`).emit(SOCKET_EVENTS.SERVER.TASK_DELETED, {
        id: taskId,
        roomId: existing.roomId,
      });
    }
  }

  static async getUserTasks(userId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: {
        OR: [{ assigneeId: userId }, { createdById: userId }],
      },
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
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });

    return tasks.map(this.formatTask);
  }

  /**
   * Concurrency-safe atomic task claiming.
   * If multiple users attempt to claim an unassigned task simultaneously,
   * PostgreSQL row-level locks and the atomic CAS (assigneeId: null) guarantee
   * that exactly one user succeeds, while all other concurrent attempts fail cleanly.
   */
  static async claimTask(taskId: string, userId: string): Promise<Task> {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        room: { include: { members: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    if (!existing) {
      throw new NotFoundError('Task not found');
    }

    const isMember = existing.room.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this room');
    }

    // If already assigned to this user, return as-is
    if (existing.assigneeId === userId) {
      return this.formatTask(existing);
    }

    // Fast-fail if already assigned to someone else
    if (existing.assigneeId && existing.assigneeId !== userId) {
      throw new ConflictError(
        `This task has already been claimed by ${existing.assignee?.name || 'another member'}`
      );
    }

    // Atomic CAS Update: Only update if assigneeId is still null
    const result = await prisma.task.updateMany({
      where: {
        id: taskId,
        assigneeId: null, // Atomic concurrency guard
      },
      data: {
        assigneeId: userId,
      },
    });

    if (result.count === 0) {
      // Another user won the race condition in the same millisecond
      const current = await prisma.task.findUnique({
        where: { id: taskId },
        include: { assignee: { select: { name: true } } },
      });
      throw new ConflictError(
        `This task was just claimed by ${current?.assignee?.name || 'another study mate'}`
      );
    }

    // Fetch the fully hydrated updated task
    const updated = await prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      include: {
        createdBy: {
          select: { id: true, email: true, name: true, avatarUrl: true, bio: true, createdAt: true },
        },
        assignee: {
          select: { id: true, email: true, name: true, avatarUrl: true, bio: true, createdAt: true },
        },
      },
    });

    const claimingUser = updated.assignee;
    RoomActivityService.broadcastActivity(existing.roomId, {
      userId,
      userName: claimingUser?.name || 'Member',
      action: 'TASK_CLAIMED',
      details: `${claimingUser?.name || 'Member'} claimed task "${updated.title}"`,
    });

    const formatted = this.formatTask(updated);

    if (this.io) {
      this.io.to(`room:${existing.roomId}`).emit(SOCKET_EVENTS.SERVER.TASK_UPDATED, formatted);
    }

    return formatted;
  }

  /**
   * Unassign an assigned task so other members can claim it.
   */
  static async unassignTask(taskId: string, userId: string): Promise<Task> {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        room: { include: { members: true } },
      },
    });

    if (!existing) {
      throw new NotFoundError('Task not found');
    }

    const userMember = existing.room.members.find((m) => m.userId === userId);
    if (!userMember) {
      throw new ForbiddenError('You are not a member of this room');
    }

    const canUnassign =
      existing.assigneeId === userId ||
      userMember.role === RoomRole.OWNER ||
      userMember.role === RoomRole.MODERATOR ||
      existing.createdById === userId;

    if (!canUnassign) {
      throw new ForbiddenError('Only the assignee, room host, or creator can unassign this task');
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId: null },
      include: {
        createdBy: {
          select: { id: true, email: true, name: true, avatarUrl: true, bio: true, createdAt: true },
        },
        assignee: {
          select: { id: true, email: true, name: true, avatarUrl: true, bio: true, createdAt: true },
        },
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    RoomActivityService.broadcastActivity(existing.roomId, {
      userId,
      userName: user?.name || 'Member',
      action: 'TASK_UNASSIGNED',
      details: `${user?.name || 'Member'} unassigned task "${updated.title}"`,
    });

    const formatted = this.formatTask(updated);

    if (this.io) {
      this.io.to(`room:${existing.roomId}`).emit(SOCKET_EVENTS.SERVER.TASK_UPDATED, formatted);
    }

    return formatted;
  }
}
