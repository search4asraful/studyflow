'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { useRoomStore } from '../../../stores/roomStore';
import { useRoomSocket } from '../../../hooks/useRoomSocket';
import { PomodoroTimer } from '../../../components/timer/PomodoroTimer';
import { TaskBoard } from '../../../components/tasks/TaskBoard';
import { ParticipantList } from '../../../components/rooms/ParticipantList';
import { RoomActivityFeed } from '../../../components/rooms/RoomActivityFeed';
import { RoomInviteModal } from '../../../components/rooms/RoomInviteModal';
import { CreateTaskModal } from '../../../components/tasks/CreateTaskModal';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft, Share2, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '../../../lib/api';
import { toast } from 'sonner';

export default function StudyRoomWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;

  const room = useRoomStore((s) => s.room);
  const role = useRoomStore((s) => s.role);
  const members = useRoomStore((s) => s.members);
  const tasks = useRoomStore((s) => s.tasks);
  const activities = useRoomStore((s) => s.activities);
  const isLoading = useRoomStore((s) => s.isLoading);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  // Hook wires authoritative socket connection, event listeners, and actions
  const {
    startTimer,
    pauseTimer,
    resumeTimer,
    skipPhase,
    createTask,
    updateTask,
    deleteTask,
    sendChatMessage,
  } = useRoomSocket(roomId);

  const handleLeaveRoom = async () => {
    if (!confirm('Are you sure you want to leave this study room?')) return;
    try {
      await apiRequest(`/rooms/${roomId}/leave`, { method: 'POST' });
      toast.success('Left study room');
      router.push('/rooms');
    } catch (err: any) {
      toast.error(err.message || 'Failed to leave room');
    }
  };

  if (isLoading && !room) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-xs font-mono text-foreground-muted">
            Connecting to authoritative study room...
          </p>
        </div>
      </AppShell>
    );
  }

  if (!room) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-foreground">Room Not Found</h2>
          <p className="text-xs text-foreground-secondary mt-2">
            The study room you are looking for does not exist or you do not have permission to access it.
          </p>
          <Link href="/rooms" className="mt-4 inline-block">
            <Button variant="primary" size="sm">
              Back to Study Rooms
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Room Header Banner */}
        <div className="card-base p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/rooms">
              <Button variant="outline" size="sm" className="p-2" title="Back to rooms">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-foreground tracking-tight">{room.name}</h1>
                <Badge variant={role === 'OWNER' ? 'accent' : 'secondary'} size="sm">
                  {role}
                </Badge>
                {room.isPrivate && <Badge size="sm">Private</Badge>}
              </div>
              {room.description && (
                <p className="text-xs text-foreground-secondary mt-1">{room.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              className="gap-1.5 text-xs font-medium"
            >
              <Share2 className="w-3.5 h-3.5" />
              Invite Code: <span className="font-mono text-accent">{room.inviteCode}</span>
            </Button>

            {role !== 'OWNER' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLeaveRoom}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 gap-1 text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                Leave
              </Button>
            )}
          </div>
        </div>

        {/* Workspace Grid: Timer & Collaborative Task Board */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Stage (7 cols on desktop): Group Pomodoro Timer */}
          <div className="lg:col-span-7 space-y-6">
            <PomodoroTimer
              onStart={startTimer}
              onPause={pauseTimer}
              onResume={resumeTimer}
              onSkip={skipPhase}
            />

            {/* Task Board */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Collaborative Task Board
                </h2>
                <span className="text-xs text-foreground-muted">
                  Real-time changes broadcast to all room members
                </span>
              </div>
              <TaskBoard
                tasks={tasks}
                onUpdateTask={(taskId, updates) => updateTask(taskId, updates)}
                onDeleteTask={(taskId) => deleteTask(taskId)}
                onOpenCreateModal={() => setIsCreateTaskModalOpen(true)}
              />
            </div>
          </div>

          {/* Sidebar Area (5 cols on desktop): Participants & Live Activity / Chat */}
          <div className="lg:col-span-5 space-y-6">
            <ParticipantList
              members={members}
              onOpenInviteModal={() => setIsInviteModalOpen(true)}
            />

            <RoomActivityFeed
              activities={activities}
              onSendMessage={(msg) => sendChatMessage(msg)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <RoomInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        roomName={room.name}
        inviteCode={room.inviteCode}
      />

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSubmit={(taskData) => createTask(taskData)}
        members={members}
      />
    </AppShell>
  );
}
