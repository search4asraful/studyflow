import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/errors';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
  SafeUser,
  UserProfile,
} from '../shared';

export class AuthService {
  static createToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, env.JWT_SECRET, {
      expiresIn: '7d',
    });
  }

  static async register(data: RegisterInput): Promise<{ user: SafeUser; token: string }> {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new BadRequestError('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        profile: {
          create: {
            dailyGoalMinutes: 120,
            timezone: 'UTC',
            themePreference: 'dark',
            soundEnabled: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    // Create a welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to StudyFlow',
        message: 'Get started by creating or joining your first study room!',
        type: 'INFO',
      },
    });

    const token = this.createToken(user.id, user.email);

    return {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    };
  }

  static async login(data: LoginInput): Promise<{ user: SafeUser; token: string }> {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.createToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    };
  }

  static async getProfile(userId: string): Promise<{ user: SafeUser; profile: UserProfile | null }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt.toISOString(),
    };

    const userProfile: UserProfile | null = user.profile
      ? {
          id: user.profile.id,
          userId: user.profile.userId,
          dailyGoalMinutes: user.profile.dailyGoalMinutes,
          timezone: user.profile.timezone,
          themePreference: (user.profile.themePreference as any) || 'dark',
          soundEnabled: user.profile.soundEnabled,
          autoStartBreaks: user.profile.autoStartBreaks,
          autoStartPomodoros: user.profile.autoStartPomodoros,
        }
      : null;

    return { user: safeUser, profile: userProfile };
  }

  static async updateProfile(
    userId: string,
    data: UpdateProfileInput
  ): Promise<{ user: SafeUser; profile: UserProfile | null }> {
    const {
      name,
      bio,
      avatarUrl,
      dailyGoalMinutes,
      timezone,
      themePreference,
      soundEnabled,
      autoStartBreaks,
      autoStartPomodoros,
    } = data;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name ? { name } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
        profile: {
          upsert: {
            create: {
              dailyGoalMinutes: dailyGoalMinutes ?? 120,
              timezone: timezone ?? 'UTC',
              themePreference: themePreference ?? 'dark',
              soundEnabled: soundEnabled ?? true,
              autoStartBreaks: autoStartBreaks ?? false,
              autoStartPomodoros: autoStartPomodoros ?? false,
            },
            update: {
              ...(dailyGoalMinutes !== undefined ? { dailyGoalMinutes } : {}),
              ...(timezone !== undefined ? { timezone } : {}),
              ...(themePreference !== undefined ? { themePreference } : {}),
              ...(soundEnabled !== undefined ? { soundEnabled } : {}),
              ...(autoStartBreaks !== undefined ? { autoStartBreaks } : {}),
              ...(autoStartPomodoros !== undefined ? { autoStartPomodoros } : {}),
            },
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt.toISOString(),
      },
      profile: user.profile
        ? {
            id: user.profile.id,
            userId: user.profile.userId,
            dailyGoalMinutes: user.profile.dailyGoalMinutes,
            timezone: user.profile.timezone,
            themePreference: (user.profile.themePreference as any) || 'dark',
            soundEnabled: user.profile.soundEnabled,
            autoStartBreaks: user.profile.autoStartBreaks,
            autoStartPomodoros: user.profile.autoStartPomodoros,
          }
        : null,
    };
  }

  static async changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError('Current password does not match');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
