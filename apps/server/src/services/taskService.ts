import { prisma } from '../config/prisma';
import { CreateTaskInput, UpdateTaskInput, Task, SOCKET_EVENTS } from '../shared';
import { ForbiddenError, NotFoundError } from '../utils/errors';
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

    // Log activities
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        userId,
        action: 'CREATED',
        details: { title: task.title, status: task.status },
      },
    });

    await prisma.roomActivity.create({
      data: {
        roomId: input.roomId,
        userId,
        action: 'TASK_CREATED',
        details: `${membership.user.name} added task: "${task.title}"`,
      },
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
    const isMember = existing.room.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this room');
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
      await prisma.taskActivity.create({
        data: {
          taskId,
          userId,
          action: 'STATUS_CHANGED',
          details: { from: oldStatus, to: input.status },
        },
      });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      await prisma.roomActivity.create({
        data: {
          roomId: existing.roomId,
          userId,
          action: input.status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED',
          details: `${user?.name || 'User'} moved "${updated.title}" to ${input.status}`,
        },
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

    // Broadcast deletion
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
}
