'use client';

import React, { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { useRoomStore } from '../../../stores/roomStore';
import { useAuthStore } from '../../../stores/authStore';
import { useRoomSocket } from '../../../hooks/useRoomSocket';
import { AstroTimer3D } from '../../../components/timer/AstroTimer3D';
import { WorkspaceKanban } from '../../../components/tasks/WorkspaceKanban';
import { AstroRoomChatPanel } from '../../../components/rooms/AstroRoomChatPanel';
import { RoomInviteModal } from '../../../components/rooms/RoomInviteModal';
import { CreateTaskModal } from '../../../components/tasks/CreateTaskModal';
import { Button } from '../../../components/ui/Button';
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  MessageSquare,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function RoomWorkspaceView({ roomId }: { roomId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Zustand Stores
  const user = useAuthStore((s) => s.user);
  const storeRoom = useRoomStore((s) => s.room);
  const storeRole = useRoomStore((s) => s.role);
  const storeMembers = useRoomStore((s) => s.members);
  const storeTasks = useRoomStore((s) => s.tasks);
  const storeActivities = useRoomStore((s) => s.activities);
  const addActivity = useRoomStore((s) => s.addActivity);

  // Dynamic room object with fallback
  const room = storeRoom || {
    id: roomId,
    name: roomId === 'SD3ASTRO' ? 'Group Astro — Engineering Workspace' : 'Study Room Workspace',
    description: roomId === 'SD3ASTRO' ? 'Collaborative workspace for engineering design, real-time sync, and focus sessions.' : 'Collaborative study and Pomodoro session.',
    inviteCode: roomId,
    isPrivate: false,
    ownerId: user?.id || 'owner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const role = storeRole || 'OWNER';

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Mobile view toggle: 'workspace' or 'sidebar'
  const [mobileView, setMobileView] = useState<'workspace' | 'sidebar'>('workspace');

  // Socket actions
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

  const handleCopyInviteCode = () => {
    const code = room.inviteCode || roomId;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success(`Invite code #${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Activity logger callback
  const handleActivityLog = (action: string, details?: string) => {
    addActivity({
      id: `act-${Date.now()}`,
      roomId: room.id,
      userId: user?.id || 'user',
      userName: user?.name || 'Member',
      action,
      details,
      createdAt: new Date().toISOString(),
    });
  };

  // GSAP Staggered Workspace Entrance Choreography
  useGSAP(
    () => {
      if (!containerRef.current) return;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const header = containerRef.current.querySelector('.workspace-header-elem');
      const timer = containerRef.current.querySelector('.workspace-timer-elem');
      const kanban = containerRef.current.querySelector('.workspace-kanban-elem');
      const chat = containerRef.current.querySelector('.workspace-chat-elem');

      if (!header || !timer || !kanban || !chat) return;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(header, {
        opacity: 0,
        y: -12,
        duration: 0.5,
      })
        .from(
          timer,
          {
            opacity: 0,
            y: 16,
            duration: 0.5,
          },
          '-=0.25'
        )
        .from(
          kanban,
          {
            opacity: 0,
            y: 18,
            duration: 0.55,
          },
          '-=0.35'
        )
        .from(
          chat,
          {
            opacity: 0,
            x: 20,
            duration: 0.55,
          },
          '-=0.4'
        );
    },
    { dependencies: [] }
  );

  const onlineCount = storeMembers.filter((m) => m.isOnline).length || 1;

  return (
    <>
      <div ref={containerRef} className="flex flex-col h-full space-y-4">
        {/* Compact Workspace Header Strip */}
        <div className="workspace-header-elem px-4 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between gap-3 border border-border/80 bg-surface/90 backdrop-blur-xl rounded-2xl shadow-xs shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Back Button */}
            <Link href="/rooms">
              <button
                className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-foreground-secondary hover:text-foreground border border-border bg-surface-elevated hover:bg-surface-subtle shrink-0 cursor-pointer transition-all shadow-2xs"
                title="Back to all rooms"
                type="button"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate max-w-xs sm:max-w-md">
                  {room.name}
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/40">
                  {role}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground-secondary bg-surface-subtle px-2 py-0.5 rounded-full border border-border font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {onlineCount} Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile View Switcher (< lg) */}
            <div className="flex lg:hidden bg-surface-subtle p-0.5 rounded-xl border border-border/80">
              <button
                onClick={() => setMobileView('workspace')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
                  mobileView === 'workspace'
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-foreground-muted hover:text-foreground'
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Board</span>
              </button>
              <button
                onClick={() => setMobileView('sidebar')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
                  mobileView === 'sidebar'
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-foreground-muted hover:text-foreground'
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Chat</span>
              </button>
            </div>

            {/* 1-Click Copy Code Pill (#SD3ASTRO) */}
            <button
              onClick={handleCopyInviteCode}
              className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-mono bg-surface-subtle border border-border hover:border-accent/40 text-foreground rounded-xl cursor-pointer transition-all shadow-2xs"
              title="Click to copy invite code"
              type="button"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-accent" />
                  <span>#{room.inviteCode || roomId}</span>
                </>
              )}
            </button>

            {/* Invite Button */}
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="h-8 px-3 inline-flex items-center gap-1.5 text-xs text-accent border border-accent/40 hover:bg-accent/15 rounded-xl cursor-pointer transition-all font-semibold shadow-2xs"
              type="button"
            >
              <Share2 className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">Invite</span>
            </button>
          </div>
        </div>

        {/* Full Available Screen Layout: Main Stage + Right Panel */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
          {/* Main Work Stage (Compact Timer + Kanban Board) */}
          <div
            className={cn(
              'flex-1 min-w-0 flex flex-col gap-2.5 min-h-0 overflow-hidden',
              mobileView === 'sidebar' ? 'hidden lg:flex' : 'flex'
            )}
          >
            {/* Compact Focus Timer Card */}
            <div className="workspace-timer-elem w-full shrink-0">
              <AstroTimer3D
                onStart={startTimer}
                onPause={pauseTimer}
                onResume={resumeTimer}
                onSkip={skipPhase}
              />
            </div>

            {/* 4-Column Draggable Kanban Board */}
            <div className="workspace-kanban-elem flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
              <WorkspaceKanban
                tasks={storeTasks}
                onUpdateTask={(taskId, updates) => updateTask(taskId, updates)}
                onDeleteTask={(taskId) => deleteTask(taskId)}
                onOpenCreateModal={() => setIsCreateTaskModalOpen(true)}
                onActivityLog={handleActivityLog}
              />
            </div>
          </div>

          {/* Right Panel: Collaborative Room Chat & Members */}
          <div
            className={cn(
              'workspace-chat-elem w-full lg:w-80 xl:w-88 shrink-0 flex flex-col h-full min-h-0 overflow-hidden',
              mobileView === 'workspace' ? 'hidden lg:flex' : 'flex'
            )}
          >
            <AstroRoomChatPanel
              onSendMessage={(msg, recipientId) => sendChatMessage(msg, recipientId)}
              incomingActivities={storeActivities}
              members={storeMembers}
              className="h-full min-h-0"
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <RoomInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        roomName={room.name}
        inviteCode={room.inviteCode || roomId}
      />

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSubmit={(taskData) => createTask(taskData)}
        members={storeMembers}
      />
    </>
  );
}

export default function StudyRoomWorkspacePage() {
  const params = useParams();
  const roomId = (params?.id as string) || 'SD3ASTRO';

  return (
    <AppShell fullWidth={true}>
      <RoomWorkspaceView roomId={roomId} />
    </AppShell>
  );
}
