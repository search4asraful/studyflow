import { PrismaClient, RoomRole, TimerPhase, TimerStatus, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { subDays, startOfDay, addHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting StudyFlow database seeding...');

  // Clean existing records to avoid conflicts on re-seed
  await prisma.notification.deleteMany();
  await prisma.taskActivity.deleteMany();
  await prisma.roomActivity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.timerState.deleteMany();
  await prisma.pomodoroRecord.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.studyRoom.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  // 1. Create Users
  const asraful = await prisma.user.create({
    data: {
      email: 'asraful@studyflow.dev',
      passwordHash: defaultPasswordHash,
      name: 'Md. Asraful Islam Furdus',
      bio: 'Full-stack developer | StudyFlow architect & systems enthusiast',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      profile: {
        create: {
          dailyGoalMinutes: 150,
          timezone: 'Asia/Dhaka',
          themePreference: 'dark',
          soundEnabled: true,
          autoStartBreaks: false,
          autoStartPomodoros: false,
        },
      },
    },
  });

  const shakil = await prisma.user.create({
    data: {
      email: 'shakil@studyflow.dev',
      passwordHash: defaultPasswordHash,
      name: 'Md Shakil Mia',
      bio: 'Software engineer | Group Astro collaborator & distributed systems fan',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      profile: {
        create: {
          dailyGoalMinutes: 120,
          timezone: 'Asia/Dhaka',
          themePreference: 'dark',
          soundEnabled: true,
          autoStartBreaks: true,
          autoStartPomodoros: false,
        },
      },
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@studyflow.dev',
      passwordHash: defaultPasswordHash,
      name: 'Alex Rivera',
      bio: 'Computer Science sophomore | Pomodoro power user',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      profile: {
        create: {
          dailyGoalMinutes: 90,
          timezone: 'America/New_York',
          themePreference: 'dark',
          soundEnabled: true,
        },
      },
    },
  });

  console.log('✅ Created users: Asraful, Shakil, Demo');

  // 2. Create Study Rooms
  const roomAstro = await prisma.studyRoom.create({
    data: {
      name: 'Group Astro — Engineering Workspace',
      description: 'Collaborative workspace for engineering design, real-time sync, and focus sessions.',
      inviteCode: 'SD3ASTRO',
      isPrivate: false,
      focusDuration: 25 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      cyclesBeforeLongBreak: 4,
      ownerId: asraful.id,
      timerState: {
        create: {
          phase: TimerPhase.FOCUS,
          status: TimerStatus.IDLE,
          remainingSeconds: 25 * 60,
          totalPhaseDuration: 25 * 60,
          currentCycle: 1,
        },
      },
      members: {
        create: [
          { userId: asraful.id, role: RoomRole.OWNER },
          { userId: shakil.id, role: RoomRole.MODERATOR },
          { userId: demoUser.id, role: RoomRole.MEMBER },
        ],
      },
    },
  });

  const roomAlgo = await prisma.studyRoom.create({
    data: {
      name: 'Algorithms & Data Structures Circle',
      description: 'Daily LeetCode and graph theory problem solving sessions.',
      inviteCode: 'ALGO2026',
      isPrivate: false,
      focusDuration: 30 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 20 * 60,
      cyclesBeforeLongBreak: 3,
      ownerId: shakil.id,
      timerState: {
        create: {
          phase: TimerPhase.FOCUS,
          status: TimerStatus.IDLE,
          remainingSeconds: 30 * 60,
          totalPhaseDuration: 30 * 60,
          currentCycle: 1,
        },
      },
      members: {
        create: [
          { userId: shakil.id, role: RoomRole.OWNER },
          { userId: asraful.id, role: RoomRole.MEMBER },
        ],
      },
    },
  });

  const roomDeepWork = await prisma.studyRoom.create({
    data: {
      name: 'Late Night Deep Work Sanctuary',
      description: 'Silent study and deep concentration block for night owls.',
      inviteCode: 'DEEPWORK',
      isPrivate: true,
      focusDuration: 50 * 60,
      shortBreakDuration: 10 * 60,
      longBreakDuration: 25 * 60,
      cyclesBeforeLongBreak: 2,
      ownerId: demoUser.id,
      timerState: {
        create: {
          phase: TimerPhase.FOCUS,
          status: TimerStatus.IDLE,
          remainingSeconds: 50 * 60,
          totalPhaseDuration: 50 * 60,
          currentCycle: 1,
        },
      },
      members: {
        create: [
          { userId: demoUser.id, role: RoomRole.OWNER },
          { userId: asraful.id, role: RoomRole.MEMBER },
        ],
      },
    },
  });

  console.log('✅ Created 3 study rooms with timer states and memberships');

  // 3. Create Tasks for Engineering Workspace
  const task1 = await prisma.task.create({
    data: {
      roomId: roomAstro.id,
      title: 'Configure PostgreSQL schema & relations with Prisma',
      description: 'Define relational entities for users, study rooms, timer states, and collaborative tasks.',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      createdById: asraful.id,
      assigneeId: asraful.id,
      position: 0,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      roomId: roomAstro.id,
      title: 'Initialize Next.js and Express monorepo architecture',
      description: 'Setup npm workspaces, shared types, and unified build pipeline.',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.URGENT,
      createdById: shakil.id,
      assigneeId: shakil.id,
      position: 1,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      roomId: roomAstro.id,
      title: 'Implement authoritative group Pomodoro timer synchronization',
      description: 'Ensure server acts as the single source of truth and reconciles disconnects reliably.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      createdById: asraful.id,
      assigneeId: asraful.id,
      position: 0,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      roomId: roomAstro.id,
      title: 'Design responsive study room workspace with GSAP transitions',
      description: 'Craft minimalist dark/light palette, timer animations, and multi-user presence display.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      createdById: shakil.id,
      assigneeId: shakil.id,
      position: 1,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      roomId: roomAstro.id,
      title: 'Review WebSocket connection teardown edge cases',
      description: 'Test socket reconnection recovery when client briefly switches networks or refreshes.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      createdById: asraful.id,
      assigneeId: demoUser.id,
      position: 0,
    },
  });

  const task6 = await prisma.task.create({
    data: {
      roomId: roomAstro.id,
      title: 'Write automated end-to-end multi-client synchronization test',
      description: 'Verify two concurrent clients receive identical state updates in under 50ms.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      createdById: shakil.id,
      position: 1,
    },
  });

  const task7 = await prisma.task.create({
    data: {
      roomId: roomAstro.id,
      title: 'Research Web Audio API for timer completion chime',
      description: 'Synthesize clean acoustic chime for phase transitions without external audio asset lag.',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.LOW,
      createdById: demoUser.id,
      position: 0,
    },
  });

  const task8 = await prisma.task.create({
    data: {
      roomId: roomAstro.id,
      title: 'Add export functionality for session summaries to PDF',
      description: 'Allow team members to download proof of participation for course records.',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.LOW,
      createdById: asraful.id,
      position: 1,
    },
  });

  console.log('✅ Created 8 realistic collaborative tasks');

  // 4. Create Task Activities
  await prisma.taskActivity.createMany({
    data: [
      {
        taskId: task1.id,
        userId: asraful.id,
        action: 'STATUS_CHANGED',
        details: { from: 'IN_PROGRESS', to: 'COMPLETED' },
      },
      {
        taskId: task2.id,
        userId: shakil.id,
        action: 'STATUS_CHANGED',
        details: { from: 'IN_PROGRESS', to: 'COMPLETED' },
      },
      {
        taskId: task3.id,
        userId: asraful.id,
        action: 'ASSIGNED',
        details: { assignee: asraful.name },
      },
    ],
  });

  // 5. Create Room Activities
  await prisma.roomActivity.createMany({
    data: [
      {
        roomId: roomAstro.id,
        userId: asraful.id,
        action: 'ROOM_CREATED',
        details: 'Created room "Group Astro — Engineering Workspace"',
      },
      {
        roomId: roomAstro.id,
        userId: shakil.id,
        action: 'MEMBER_JOINED',
        details: 'Joined as Moderator',
      },
      {
        roomId: roomAstro.id,
        userId: demoUser.id,
        action: 'MEMBER_JOINED',
        details: 'Joined via invite code SD3ASTRO',
      },
      {
        roomId: roomAstro.id,
        userId: asraful.id,
        action: 'TASK_COMPLETED',
        details: 'Completed task: Configure PostgreSQL schema & relations with Prisma',
      },
    ],
  });

  // 6. Seed Past Pomodoro Records (14-day history for realistic streak and analytics)
  const now = new Date();
  const pomodoroRecordsData: {
    userId: string;
    roomId: string;
    phase: TimerPhase;
    durationMinutes: number;
    completedAt: Date;
  }[] = [];

  // Generate continuous streak for Asraful (last 10 days)
  for (let i = 9; i >= 0; i--) {
    const day = subDays(now, i);
    const sessionsToday = i === 0 ? 4 : 3 + (i % 3);
    for (let s = 0; s < sessionsToday; s++) {
      pomodoroRecordsData.push({
        userId: asraful.id,
        roomId: roomAstro.id,
        phase: TimerPhase.FOCUS,
        durationMinutes: 25,
        completedAt: addHours(startOfDay(day), 10 + s * 2),
      });
      // Add break records
      pomodoroRecordsData.push({
        userId: asraful.id,
        roomId: roomAstro.id,
        phase: s === 3 ? TimerPhase.LONG_BREAK : TimerPhase.SHORT_BREAK,
        durationMinutes: s === 3 ? 15 : 5,
        completedAt: addHours(startOfDay(day), 10 + s * 2 + 0.5),
      });
    }
  }

  // Generate streak for Shakil (last 8 days)
  for (let i = 7; i >= 0; i--) {
    const day = subDays(now, i);
    const sessionsToday = 2 + (i % 4);
    for (let s = 0; s < sessionsToday; s++) {
      pomodoroRecordsData.push({
        userId: shakil.id,
        roomId: roomAstro.id,
        phase: TimerPhase.FOCUS,
        durationMinutes: 25,
        completedAt: addHours(startOfDay(day), 11 + s * 2),
      });
    }
  }

  await prisma.pomodoroRecord.createMany({
    data: pomodoroRecordsData,
  });

  console.log(`✅ Seeded ${pomodoroRecordsData.length} Pomodoro historical records`);

  // 7. Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: asraful.id,
        title: 'Welcome to StudyFlow!',
        message: 'Your study room Group Astro — Engineering Workspace is active.',
        type: 'INFO',
        isRead: false,
      },
      {
        userId: asraful.id,
        title: 'Team Member Joined',
        message: 'Md Shakil Mia joined your study room.',
        type: 'ROOM_INVITE',
        isRead: true,
      },
      {
        userId: shakil.id,
        title: 'Assigned to Task',
        message: 'You were assigned to "Initialize Next.js and Express monorepo architecture".',
        type: 'TASK_ASSIGNED',
        isRead: false,
      },
    ],
  });

  console.log('✅ Seeded user notifications');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
