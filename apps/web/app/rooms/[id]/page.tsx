'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { useRoomStore } from '../../../stores/roomStore';
import { useAuthStore } from '../../../stores/authStore';
import { useTimerStore } from '../../../stores/timerStore';
import { useRoomSocket } from '../../../hooks/useRoomSocket';
import { PomodoroTimer } from '../../../components/timer/PomodoroTimer';
import { WorkspaceKanban } from '../../../components/tasks/WorkspaceKanban';
import { AstroRoomChatPanel } from '../../../components/rooms/AstroRoomChatPanel';
import { RoomInviteModal } from '../../../components/rooms/RoomInviteModal';
import { CreateTaskModal } from '../../../components/tasks/CreateTaskModal';
import { EditTaskModal } from '../../../components/tasks/EditTaskModal';
import { Button } from '../../../components/ui/Button';
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Clock,
  CheckSquare,
  LayoutGrid,
  LogOut,
  Trash2,
  Loader2,
  Play,
  Pause,
  SkipForward,
  Plus,
  Sparkles,
  Target,
  User,
  UserPlus,
  Pencil,
  Search,
  Filter,
  Users,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn, formatTimeRemaining } from '../../../lib/utils';
import { apiRequest } from '../../../lib/api';
import { playTaskCompletionSound } from '../../../lib/audio';
import { triggerConfetti } from '../../../lib/confetti';
import { Task, TaskPriority, TaskStatus } from '@studyflow/shared';

function RoomWorkspaceView({ roomId }: { roomId: string }) {
  const router = useRouter();

  // Zustand Stores
  const user = useAuthStore((s) => s.user);
  const storeRoom = useRoomStore((s) => s.room);
  const storeRole = useRoomStore((s) => s.role);
  const storeMembers = useRoomStore((s) => s.members);
  const storeTasks = useRoomStore((s) => s.tasks);
  const storeActivities = useRoomStore((s) => s.activities);

  // Timer Store for sticky mini-bar
  const timerDisplaySeconds = useTimerStore((s) => s.displaySeconds);
  const timerPhase = useTimerStore((s) => s.phase);
  const timerStatus = useTimerStore((s) => s.status);
  const timerCycle = useTimerStore((s) => s.currentCycle);

  // Dynamic room object with fallback
  const room = storeRoom || {
    id: roomId,
    name: roomId === 'SD3ASTRO' ? 'Group Astro — Focus Workspace' : 'Study Room Session',
    description: 'Collaborative Pomodoro focus session and shared task workspace.',
    inviteCode: roomId,
    isPrivate: false,
    ownerId: user?.id || 'owner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const role = storeRole || 'OWNER';

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Active focus target task
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // View mode in the main stage: 'focus' (Timer Hero + Clean Task List) | 'board' (4-Column Kanban)
  const [stageMode, setStageMode] = useState<'focus' | 'board'>('focus');

  // Desktop side panel toggle (Chat & Members)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // Mobile active tab: 'timer' | 'tasks' | 'chat'
  const [mobileTab, setMobileTab] = useState<'timer' | 'tasks' | 'chat'>('timer');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const processedActivityIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef(true);

  // Task filtering in minimalist focus list
  const [taskFilterStatus, setTaskFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  const isOwner = Boolean(
    (room.ownerId && user?.id && room.ownerId === user.id) || role === 'OWNER'
  );
  const canControlTimer = role === 'OWNER' || role === 'MODERATOR' || !storeRoom;

  // Track unread chat messages for badge
  useEffect(() => {
    if (!storeActivities || storeActivities.length === 0) return;

    if (isInitialMountRef.current) {
      storeActivities.forEach((act) => processedActivityIdsRef.current.add(act.id));
      isInitialMountRef.current = false;
      return;
    }

    if (mobileTab === 'chat' || isSidePanelOpen) {
      setUnreadChatCount(0);
      storeActivities.forEach((act) => processedActivityIdsRef.current.add(act.id));
      return;
    }

    let newUnread = 0;
    for (const act of storeActivities) {
      if (!processedActivityIdsRef.current.has(act.id)) {
        processedActivityIdsRef.current.add(act.id);
        const isFromMe = act.userId === user?.id;
        if (!isFromMe && (act.action === 'CHAT_MESSAGE' || act.action === 'DIRECT_CHAT')) {
          newUnread += 1;
        }
      }
    }

    if (newUnread > 0) {
      setUnreadChatCount((prev) => prev + newUnread);
    }
  }, [storeActivities, mobileTab, isSidePanelOpen, user?.id]);

  // Socket actions
  const {
    startTimer,
    pauseTimer,
    resumeTimer,
    skipPhase,
    createTask,
    updateTask,
    deleteTask,
    claimTask,
    sendChatMessage,
    updateMemberRole,
  } = useRoomSocket(roomId);

  const handleCopyInviteCode = () => {
    const code = room.inviteCode || roomId;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success(`Invite code #${code} copied`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeaveOrDeleteRoom = async () => {
    if (isOwner) {
      const confirmDelete = window.confirm(
        'Are you sure you want to delete this study room? This will permanently end the session for all participants.'
      );
      if (!confirmDelete) return;

      try {
        setIsLeaving(true);
        await apiRequest(`/rooms/${roomId}`, { method: 'DELETE' });
        toast.success('Study room deleted');
        useRoomStore.getState().clearRoom();
        router.push('/rooms');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete room');
        setIsLeaving(false);
      }
    } else {
      const confirmLeave = window.confirm('Are you sure you want to leave this study room?');
      if (!confirmLeave) return;

      try {
        setIsLeaving(true);
        await apiRequest(`/rooms/${roomId}/leave`, { method: 'POST' });
        toast.success('You left the study room');
        useRoomStore.getState().clearRoom();
        router.push('/rooms');
      } catch (err: any) {
        toast.error(err.message || 'Failed to leave room');
        setIsLeaving(false);
      }
    }
  };

  const onlineMembersCount = useMemo(() => {
    const online = storeMembers.filter((m) => m.isOnline).length;
    return online > 0 ? online : 1;
  }, [storeMembers]);

  // Active focus task
  const activeFocusTask = useMemo(() => {
    if (!activeTaskId) return null;
    return storeTasks.find((t) => t.id === activeTaskId) || null;
  }, [activeTaskId, storeTasks]);

  const handleSelectFocusTask = (task: Task) => {
    if (activeTaskId === task.id) {
      setActiveTaskId(null);
      toast.info('Focus target cleared');
    } else {
      setActiveTaskId(task.id);
      toast.success(`Focus target: ${task.title}`);
    }
  };

  const handleCompleteActiveFocusTask = () => {
    if (!activeTaskId) return;
    updateTask(activeTaskId, { status: 'COMPLETED' });
    playTaskCompletionSound();
    triggerConfetti({ particleCount: 70 });
    toast.success('Focus target completed! Great work!');
    setActiveTaskId(null);
  };

  // Filtered task items for the minimalist task list
  const filteredTaskList = useMemo(() => {
    return storeTasks.filter((t) => {
      const matchesStatus =
        taskFilterStatus === 'ALL'
          ? true
          : taskFilterStatus === 'ACTIVE'
          ? t.status !== 'COMPLETED'
          : t.status === 'COMPLETED';

      const matchesSearch =
        taskSearchQuery.trim() === ''
          ? true
          : t.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
            (t.description && t.description.toLowerCase().includes(taskSearchQuery.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }, [storeTasks, taskFilterStatus, taskSearchQuery]);

  const priorityColors: Record<TaskPriority, string> = {
    LOW: 'bg-foreground-muted',
    MEDIUM: 'bg-accent',
    HIGH: 'bg-amber-400',
    URGENT: 'bg-rose-400',
  };

  return (
    <>
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        {/* Single Minimal Hairline Header */}
        <header className="h-12 px-3 sm:px-5 flex items-center justify-between border-b border-border/60 bg-canvas/90 backdrop-blur-md shrink-0 select-none">
          {/* Left: Back Link & Room Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <Link
              href="/rooms"
              className="text-foreground-muted hover:text-foreground transition-colors p-1 -ml-1 rounded-lg"
              title="Back to all rooms"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight truncate max-w-35 xs:max-w-[200px] sm:max-w-xs md:max-w-md">
                {room.name}
              </h1>

              <span className="hidden xs:inline-flex text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-surface-subtle text-foreground-secondary border border-border/80">
                {role}
              </span>

              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-foreground-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{onlineMembersCount} active</span>
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1-Click Copy Invite Code */}
            <button
              onClick={handleCopyInviteCode}
              className="h-7 px-2 sm:px-2.5 inline-flex items-center gap-1 text-[11px] font-mono text-foreground-secondary hover:text-foreground bg-surface-subtle hover:bg-surface-elevated border border-border/80 hover:border-accent/40 rounded-lg cursor-pointer transition-all"
              title="Copy invite code"
              type="button"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold hidden xs:inline">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-accent" />
                  <span className="font-semibold">#{room.inviteCode || roomId}</span>
                </>
              )}
            </button>

            {/* Invite Button */}
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="h-7 px-2.5 inline-flex items-center gap-1 text-[11px] text-accent font-medium hover:bg-accent/10 border border-accent/30 rounded-lg cursor-pointer transition-colors"
              type="button"
              title="Invite Members"
            >
              <Share2 className="w-3 h-3 text-accent" />
              <span className="hidden xs:inline">Invite</span>
            </button>

            {/* Chat & Members Toggle (Mobile: toggles chat view; Desktop: toggles side panel) */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setMobileTab((cur) => (cur === 'chat' ? 'timer' : 'chat'));
                  setUnreadChatCount(0);
                } else {
                  setIsSidePanelOpen((prev) => !prev);
                  setUnreadChatCount(0);
                }
              }}
              className={cn(
                'hidden sm:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer',
                (mobileTab === 'chat' || isSidePanelOpen)
                  ? 'bg-accent text-white border-accent shadow-xs'
                  : 'bg-surface-subtle text-foreground-secondary hover:text-foreground border-border/80'
              )}
              title="Toggle Chat & Members"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Chat</span>
              {unreadChatCount > 0 && !(isSidePanelOpen || mobileTab === 'chat') && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse">
                  +{unreadChatCount}
                </span>
              )}
            </button>

            {/* Leave / Delete Action */}
            <button
              onClick={handleLeaveOrDeleteRoom}
              disabled={isLeaving}
              className="h-7 px-2 inline-flex items-center justify-center text-foreground-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
              type="button"
              title={isOwner ? 'Delete Study Room' : 'Leave Study Room'}
            >
              {isLeaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isOwner ? (
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile View Selector Bar (< lg) */}
        <div className="flex lg:hidden items-center px-3 py-1.5 border-b border-border/50 bg-canvas/80 shrink-0 gap-1 select-none">
          <button
            type="button"
            onClick={() => setMobileTab('timer')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
              mobileTab === 'timer'
                ? 'bg-surface-elevated text-foreground font-semibold shadow-2xs border border-border/60'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>Focus</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('tasks')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
              mobileTab === 'tasks'
                ? 'bg-surface-elevated text-foreground font-semibold shadow-2xs border border-border/60'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            <CheckSquare className="w-3.5 h-3.5 text-accent" />
            <span>Tasks</span>
            <span className="text-[10px] font-mono text-foreground-muted">
              ({storeTasks.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileTab('chat');
              setUnreadChatCount(0);
            }}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
              mobileTab === 'chat'
                ? 'bg-surface-elevated text-foreground font-semibold shadow-2xs border border-border/60'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5 text-accent" />
            <span>Chat</span>
            {unreadChatCount > 0 && mobileTab !== 'chat' ? (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse">
                +{unreadChatCount}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-foreground-muted">
                ({storeMembers.length})
              </span>
            )}
          </button>
        </div>

        {/* Sticky Mobile Mini-Timer Bar (Shown only when in mobile 'tasks' or 'chat' tab) */}
        {mobileTab !== 'timer' && (
          <div className="flex flex-col gap-3 lg:hidden items-center justify-center p-3 bg-surface-elevated/95 border-b border-border/80 shadow-xs shrink-0 backdrop-blur-md animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => setMobileTab('timer')}
              className="flex items-center gap-2 cursor-pointer text-left min-w-0"
              title="Return to full Timer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-accent font-mono uppercase">
                {timerPhase.replace('_', ' ')}
              </span>
              <span className="text-3xl font-extrabold font-mono tabular-nums text-foreground">
                {formatTimeRemaining(timerDisplaySeconds)}
              </span>
              <span className="text-[10px] font-mono text-foreground-muted hidden xs:inline">
                • Interval {timerCycle}
              </span>
            </button>

            {canControlTimer && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (timerStatus === 'RUNNING') pauseTimer();
                    else if (timerStatus === 'PAUSED') resumeTimer();
                    else startTimer();
                  }}
                  className="h-7 px-2.5 rounded-md bg-accent text-white font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  {timerStatus === 'RUNNING' ? (
                    <Pause className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                  <span>{timerStatus === 'RUNNING' ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => skipPhase()}
                  className="h-7 w-7 rounded-md bg-surface-subtle text-foreground-secondary hover:text-foreground border border-border flex items-center justify-center cursor-pointer"
                  title="Skip phase"
                >
                  <SkipForward className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Work Area: Center Stage + Optional Side Panel */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Center Stage: The Heart of the Study Room */}
          <div
            className={cn(
              'flex-1 min-w-0 flex flex-col min-h-0 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4',
              mobileTab === 'chat' && 'hidden lg:flex'
            )}
          >
            {/* Mobile Tab: 'tasks' view */}
            {mobileTab === 'tasks' ? (
              <div className="flex-1 flex flex-col min-h-0 pb-4">
                <WorkspaceKanban
                  tasks={storeTasks}
                  onUpdateTask={(taskId, updates) => updateTask(taskId, updates)}
                  onDeleteTask={(taskId) => deleteTask(taskId)}
                  onClaimTask={(taskId) => claimTask(taskId)}
                  currentUserId={user?.id}
                  currentUserRole={role}
                  roomOwnerId={room.ownerId}
                  onOpenCreateModal={() => setIsCreateTaskModalOpen(true)}
                  members={storeMembers}
                  activeTaskId={activeTaskId}
                  onSelectFocusTask={handleSelectFocusTask}
                />
              </div>
            ) : stageMode === 'board' ? (
              /* Desktop Board Mode (Full Kanban) */
              <div className="flex-1 flex flex-col min-h-0 gap-3">
                <div className="flex items-center justify-between pb-1 border-b border-border/50 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStageMode('focus')}
                      className="text-xs text-accent hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Back to Focus View</span>
                    </button>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    className="h-7 text-xs btn-primary gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Task</span>
                  </Button>
                </div>
                <div className="flex-1 min-h-0">
                  <WorkspaceKanban
                    tasks={storeTasks}
                    onUpdateTask={(taskId, updates) => updateTask(taskId, updates)}
                    onDeleteTask={(taskId) => deleteTask(taskId)}
                    onClaimTask={(taskId) => claimTask(taskId)}
                    currentUserId={user?.id}
                    currentUserRole={role}
                    roomOwnerId={room.ownerId}
                    onOpenCreateModal={() => setIsCreateTaskModalOpen(true)}
                    members={storeMembers}
                    activeTaskId={activeTaskId}
                    onSelectFocusTask={handleSelectFocusTask}
                  />
                </div>
              </div>
            ) : (
              /* Desktop Focus Mode & Mobile 'timer' tab (Hero Pomodoro Timer + Minimal Task List) */
              <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto pb-6">
                {/* HERO POMODORO TIMER CENTERPIECE */}
                <PomodoroTimer
                  onStart={startTimer}
                  onPause={pauseTimer}
                  onResume={resumeTimer}
                  onSkip={skipPhase}
                  activeTaskTitle={activeFocusTask?.title}
                  onCompleteActiveTask={handleCompleteActiveFocusTask}
                  onClearActiveTask={() => setActiveTaskId(null)}
                />

                {/* SPRINT TASKS (Minimalist Flat Task Manager) */}
                <div className="mt-6 sm:mt-8 pt-4 border-t border-border/50 flex-1 flex flex-col min-h-0">
                  {/* Task Toolbar: Title, Filter Tabs, Add CTA */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Session Tasks
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-subtle text-foreground-secondary border border-border/70">
                        {storeTasks.filter((t) => t.status !== 'COMPLETED').length} active
                      </span>

                      {/* Desktop toggle to full Kanban board */}
                      <button
                        type="button"
                        onClick={() => setStageMode('board')}
                        className="hidden sm:inline-flex items-center gap-1 text-[11px] text-foreground-muted hover:text-accent font-medium transition-colors ml-2 cursor-pointer"
                        title="Switch to full 4-column drag & drop board"
                      >
                        <LayoutGrid className="w-3 h-3" />
                        <span>Kanban view</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Filter Pill Tabs */}
                      <div className="flex items-center p-0.5 rounded-lg bg-surface-subtle border border-border/80 text-[11px]">
                        {(['ACTIVE', 'ALL', 'COMPLETED'] as const).map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setTaskFilterStatus(filter)}
                            className={cn(
                              'px-2.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer',
                              taskFilterStatus === filter
                                ? 'bg-surface-elevated text-foreground shadow-2xs font-semibold'
                                : 'text-foreground-muted hover:text-foreground'
                            )}
                          >
                            {filter === 'ACTIVE' ? 'Active' : filter === 'ALL' ? 'All' : 'Done'}
                          </button>
                        ))}
                      </div>

                      {/* Add Task Button */}
                      <Button
                        size="sm"
                        onClick={() => setIsCreateTaskModalOpen(true)}
                        className="h-7 px-2.5 text-xs btn-primary gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </Button>
                    </div>
                  </div>

                  {/* Search Bar (if tasks exist) */}
                  {storeTasks.length > 3 && (
                    <div className="relative mb-3 shrink-0">
                      <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search tasks..."
                        value={taskSearchQuery}
                        onChange={(e) => setTaskSearchQuery(e.target.value)}
                        className="w-full h-7 pl-8 pr-3 text-xs bg-surface-subtle border border-border/60 rounded-lg text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-hidden"
                      />
                    </div>
                  )}

                  {/* Task Rows List */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
                    {filteredTaskList.length === 0 ? (
                      <div className="py-10 text-center text-foreground-muted space-y-1.5">
                        <p className="text-xs font-medium text-foreground-secondary">
                          {taskFilterStatus === 'COMPLETED'
                            ? 'No completed tasks yet'
                            : 'No active tasks'}
                        </p>
                        <p className="text-[11px] text-foreground-muted">
                          {taskFilterStatus === 'COMPLETED'
                            ? 'Finish tasks during your Pomodoro intervals to see them here.'
                            : 'Add tasks you want to accomplish during this study session.'}
                        </p>
                        {taskFilterStatus !== 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => setIsCreateTaskModalOpen(true)}
                            className="text-xs text-accent font-semibold hover:underline cursor-pointer pt-1"
                          >
                            + Add task
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredTaskList.map((task) => {
                        const isFocus = activeTaskId === task.id;
                        const isCompleted = task.status === 'COMPLETED';

                        return (
                          <div
                            key={task.id}
                            className={cn(
                              'group px-3 py-2 rounded-xl transition-all duration-150 flex items-center justify-between gap-3 border',
                              isFocus
                                ? 'bg-accent/10 border-accent/40 shadow-xs'
                                : isCompleted
                                ? 'bg-surface-subtle/50 border-border/40 opacity-70 hover:opacity-100'
                                : 'bg-surface-subtle hover:bg-surface-elevated border-border/60 hover:border-border'
                            )}
                          >
                            {/* Left: Complete Checkbox + Title + Description */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextStatus: TaskStatus = isCompleted ? 'TODO' : 'COMPLETED';
                                  updateTask(task.id, { status: nextStatus });
                                  if (nextStatus === 'COMPLETED') {
                                    playTaskCompletionSound();
                                    triggerConfetti({ particleCount: 50 });
                                    if (activeTaskId === task.id) setActiveTaskId(null);
                                  }
                                }}
                                className={cn(
                                  'w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0',
                                  isCompleted
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-border-focus hover:border-emerald-400 text-transparent hover:text-emerald-400'
                                )}
                                title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                              >
                                <Check className="w-3 h-3 stroke-3" />
                              </button>

                              <span
                                className={cn('w-2 h-2 rounded-full shrink-0', priorityColors[task.priority])}
                                title={`Priority: ${task.priority}`}
                              />

                              <div className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    'text-xs font-medium block truncate',
                                    isCompleted ? 'line-through text-foreground-muted' : isFocus ? 'text-accent font-semibold' : 'text-foreground'
                                  )}
                                  title={task.title}
                                >
                                  {task.title}
                                </span>
                                {task.description && (
                                  <p className="text-[11px] text-foreground-muted truncate">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right: Assignee, Focus Target Pill, Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Assignee */}
                              {task.assignee ? (
                                <span className="text-[10px] font-mono text-foreground-muted hidden sm:inline-flex items-center gap-1 bg-surface-subtle px-1.5 py-0.5 rounded border border-border/60">
                                  <User className="w-2.5 h-2.5 text-accent" />
                                  <span className="truncate max-w-17.5">{task.assignee.name}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => claimTask(task.id)}
                                  className="text-[10px] font-medium text-accent hover:underline cursor-pointer hidden sm:inline"
                                >
                                  Claim
                                </button>
                              )}

                              {/* Target / Focus Button (only for active tasks) */}
                              {!isCompleted && (
                                <button
                                  type="button"
                                  onClick={() => handleSelectFocusTask(task)}
                                  className={cn(
                                    'h-6 px-2 rounded-md text-[10px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer border active:scale-95 select-none',
                                    isFocus
                                      ? 'bg-accent text-white border-accent shadow-xs'
                                      : 'bg-surface-subtle hover:bg-surface-elevated text-foreground-muted hover:text-accent border-border/80'
                                  )}
                                  title={isFocus ? 'Deselect focus target' : 'Focus on this task during timer'}
                                >
                                  <Target className="w-2.5 h-2.5" />
                                  <span>{isFocus ? 'Focusing' : 'Focus'}</span>
                                </button>
                              )}

                              {/* Edit & Delete Actions */}
                              <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => setEditingTask(task)}
                                  className="p-1 rounded text-foreground-muted hover:text-accent hover:bg-surface-subtle transition-colors cursor-pointer"
                                  title="Edit task"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteTask(task.id)}
                                  className="p-1 rounded text-foreground-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Delete task"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Slide-Over Side Panel: Room Chat & Members */}
          {isSidePanelOpen && (
            <aside className="hidden lg:flex w-80 xl:w-88 border-l border-border/60 bg-surface/90 backdrop-blur-xl flex-col h-full min-h-0 shrink-0 animate-in slide-in-from-right duration-200">
              <AstroRoomChatPanel
                onSendMessage={(msg, recipientId) => sendChatMessage(msg, recipientId)}
                onUpdateMemberRole={(targetUserId, newRole) => updateMemberRole(targetUserId, newRole)}
                incomingActivities={storeActivities}
                members={storeMembers}
                currentUserRole={role}
                roomOwnerId={room.ownerId}
                className="h-full min-h-0"
              />
            </aside>
          )}

          {/* Mobile Full-Screen Chat View (when mobileTab === 'chat') */}
          {mobileTab === 'chat' && (
            <div className="flex-1 flex flex-col h-full min-h-0 lg:hidden p-2 sm:p-3">
              <AstroRoomChatPanel
                onSendMessage={(msg, recipientId) => sendChatMessage(msg, recipientId)}
                onUpdateMemberRole={(targetUserId, newRole) => updateMemberRole(targetUserId, newRole)}
                incomingActivities={storeActivities}
                members={storeMembers}
                currentUserRole={role}
                roomOwnerId={room.ownerId}
                className="h-full min-h-0 rounded-2xl border border-border/60"
              />
            </div>
          )}
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

      {editingTask && (
        <EditTaskModal
          isOpen={Boolean(editingTask)}
          onClose={() => setEditingTask(null)}
          onSubmit={(taskId, updates) => {
            updateTask(taskId, updates);
            setEditingTask(null);
          }}
          task={editingTask}
          members={storeMembers}
        />
      )}
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
