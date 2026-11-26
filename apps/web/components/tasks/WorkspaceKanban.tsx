'use client';

import { useGSAP } from '@gsap/react';
import { RoomMember, RoomRole, Task, TaskPriority, TaskStatus } from '@studyflow/shared';
import { format } from 'date-fns';
import gsap from 'gsap';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  UserPlus,
  X,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { playTaskCompletionSound } from '../../lib/audio';
import { triggerConfetti } from '../../lib/confetti';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { EditTaskModal } from './EditTaskModal';
import { toast } from 'sonner';

export interface WorkspaceKanbanProps {
  tasks?: Task[];
  isLoading?: boolean;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onClaimTask?: (taskId: string) => Promise<any> | void;
  currentUserId?: string;
  currentUserRole?: RoomRole | string;
  roomOwnerId?: string;
  onOpenCreateModal?: () => void;
  onActivityLog?: (action: string, details?: string) => void;
  className?: string;
  showRoomLink?: boolean;
  members?: RoomMember[];
  activeTaskId?: string | null;
  onSelectFocusTask?: (task: Task) => void;
  showDelete?: boolean;
}



interface KanbanColumnConfig {
  id: TaskStatus;
  title: string;
  dotColor: string;
  badgeStyle: string;
  headerBorder: string;
  dropBorder: string;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'BACKLOG',
    title: 'BACKLOG',
    dotColor: 'bg-foreground-muted',
    badgeStyle: 'bg-surface-elevated text-foreground-muted border-border',
    headerBorder: 'border-border-subtle',
    dropBorder: 'border-accent/70 shadow-[0_0_24px_rgba(63,114,175,0.25)] bg-accent/10',
  },
  {
    id: 'TODO',
    title: 'TO DO',
    dotColor: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    badgeStyle: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    headerBorder: 'border-border-subtle',
    dropBorder: 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] bg-amber-500/10',
  },
  {
    id: 'IN_PROGRESS',
    title: 'IN PROGRESS',
    dotColor: 'bg-accent shadow-[0_0_8px_rgba(63,114,175,0.6)] animate-pulse',
    badgeStyle: 'bg-accent-muted text-accent border-accent/40',
    headerBorder: 'border-border-subtle',
    dropBorder: 'border-accent/80 shadow-[0_0_25px_rgba(63,114,175,0.35)] bg-accent/15',
  },
  {
    id: 'COMPLETED',
    title: 'COMPLETED',
    dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
    badgeStyle: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    headerBorder: 'border-border-subtle',
    dropBorder: 'border-emerald-500/70 shadow-[0_0_25px_rgba(16,185,129,0.3)] bg-emerald-500/10',
  },
];

export const WorkspaceKanban: React.FC<WorkspaceKanbanProps> = ({
  tasks: propTasks,
  isLoading = false,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
  onClaimTask,
  currentUserId,
  currentUserRole,
  roomOwnerId,
  onOpenCreateModal,
  onActivityLog,
  className = '',
  showRoomLink = false,
  members = [],
  activeTaskId,
  onSelectFocusTask,
  showDelete = true,
}) => {
  // Use prop tasks if provided, otherwise empty array
  const [localTasks, setLocalTasks] = useState<Task[]>(() => {
    return propTasks !== undefined ? propTasks : [];
  });

  // Keep synced if propTasks changes from socket
  useEffect(() => {
    if (propTasks !== undefined) {
      setLocalTasks(propTasks);
    }
  }, [propTasks]);

  const [claimingTaskIds, setClaimingTaskIds] = useState<Set<string>>(new Set());

  // Permission gate: Only task creator, assignee, room host (OWNER), or room moderator can edit/move/reopen tasks
  const canUserManageTask = (task: Task): boolean => {
    if (!currentUserId) return true;
    if (task.createdById === currentUserId) return true;
    if (task.assigneeId === currentUserId || task.assignee?.id === currentUserId) return true;
    if (currentUserRole === 'OWNER' || (roomOwnerId && roomOwnerId === currentUserId)) return true;
    if (currentUserRole === 'MODERATOR') return true;
    const userMember = members.find((m) => m.userId === currentUserId);
    if (userMember?.role === 'OWNER' || userMember?.role === 'MODERATOR') return true;
    return false;
  };

  // Only task creator, room host (OWNER), or room moderator can delete tasks
  const canUserDeleteTask = (task: Task): boolean => {
    if (!currentUserId) return true;
    if (task.createdById === currentUserId) return true;
    if (currentUserRole === 'OWNER' || (roomOwnerId && roomOwnerId === currentUserId)) return true;
    if (currentUserRole === 'MODERATOR') return true;
    const userMember = members.find((m) => m.userId === currentUserId);
    if (userMember?.role === 'OWNER' || userMember?.role === 'MODERATOR') return true;
    return false;
  };

  const handleClaimTask = async (taskId: string) => {
    if (claimingTaskIds.has(taskId)) return;
    setClaimingTaskIds((prev) => new Set(prev).add(taskId));
    try {
      if (onClaimTask) {
        await onClaimTask(taskId);
      } else {
        const memberUser = members.find((m) => m.userId === currentUserId)?.user || (currentUserId ? {
          id: currentUserId,
          name: 'You',
          email: '',
          avatarUrl: null,
          bio: null,
          createdAt: new Date().toISOString(),
        } : null);
        if (memberUser) {
          setLocalTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    assigneeId: memberUser.id,
                    assignee: {
                      id: memberUser.id,
                      name: memberUser.name,
                      email: memberUser.email,
                      avatarUrl: memberUser.avatarUrl || null,
                      createdAt: new Date().toISOString(),
                    },
                  }
                : t
            )
          );
        }
      }
    } finally {
      setClaimingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<TaskStatus | null>(null);
  const [activeMobileColumn, setActiveMobileColumn] = useState<TaskStatus>('TODO');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressPercentTextRef = useRef<HTMLSpanElement>(null);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return localTasks.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.assignee && t.assignee.name.toLowerCase().includes(q));

      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [localTasks, searchQuery, priorityFilter]);

  // Overall Task Progress & Status Breakdown calculations
  const totalTasksCount = localTasks.length;
  const completedTasksCount = localTasks.filter((t) => t.status === 'COMPLETED').length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const statusCounts = useMemo(() => {
    return {
      BACKLOG: localTasks.filter((t) => t.status === 'BACKLOG').length,
      TODO: localTasks.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: localTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      COMPLETED: localTasks.filter((t) => t.status === 'COMPLETED').length,
    };
  }, [localTasks]);

  // Tween progress bar with GSAP whenever progressPercent changes
  useGSAP(
    () => {
      if (progressBarRef.current) {
        gsap.to(progressBarRef.current, {
          width: `${progressPercent}%`,
          duration: 0.7,
          ease: 'power3.out',
        });
      }
    },
    { dependencies: [progressPercent] }
  );

  // Status transitions
  const handleMoveTaskStatus = (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number
  ) => {
    const task = localTasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!canUserManageTask(task)) {
      toast.error('Only the task creator, room host, or moderator can move this task');
      return;
    }

    const oldStatus = task.status;
    // Don't trigger updates or activity if released back to original status
    if (oldStatus === newStatus) {
      return;
    }

    const isNowCompleted = newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED';

    setLocalTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: newStatus,
            position: targetIndex !== undefined ? targetIndex : t.position,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      return updated;
    });

    if (onUpdateTask) {
      onUpdateTask(taskId, { status: newStatus });
    }

    // Play sound & trigger confetti if completed
    if (isNowCompleted) {
      playTaskCompletionSound();
      triggerConfetti({ particleCount: 75 });
    }

    // Animate settlement on target card
    setTimeout(() => {
      const cardEl = document.getElementById(`kanban-card-${taskId}`);
      if (cardEl) {
        gsap.fromTo(
          cardEl,
          { scale: 0.94, y: -6 },
          { scale: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }
        );
      }
    }, 20);

    // Activity log notification - only when status changed
    if (onActivityLog) {
      const colName = KANBAN_COLUMNS.find((c) => c.id === newStatus)?.title || newStatus;
      onActivityLog('TASK_UPDATED', `Moved "${task.title}" to ${colName}`);
    }
  };

  const handleSaveEditedTask = (taskId: string, updates: Partial<Task>) => {
    const existing = localTasks.find((t) => t.id === taskId);
    if (existing && !canUserManageTask(existing)) {
      toast.error('Only the task creator, room host, or moderator can edit this task');
      return;
    }

    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );

    if (onUpdateTask) {
      onUpdateTask(taskId, updates);
    }

    if (onActivityLog && existing) {
      if (updates.status && updates.status !== existing.status) {
        const colName = KANBAN_COLUMNS.find((c) => c.id === updates.status)?.title || updates.status;
        onActivityLog('TASK_UPDATED', `Moved "${updates.title || existing.title}" to ${colName}`);
      } else {
        onActivityLog('TASK_UPDATED', `Updated task "${updates.title || existing.title}"`);
      }
    }

    if (onEditTask && existing) {
      onEditTask({ ...existing, ...updates });
    }

    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    const task = localTasks.find((t) => t.id === taskId) || propTasks?.find((t) => t.id === taskId);
    if (task && !canUserManageTask(task)) {
      toast.error('Only the task creator, room host, or moderator can delete this task');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${task?.title || 'this task'}"?`)) {
      return;
    }
    setLocalTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (onDeleteTask) {
      onDeleteTask(taskId);
    }
    if (onActivityLog && task) {
      onActivityLog('TASK_DELETED', `Deleted task "${task.title}"`);
    }
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    const task = localTasks.find((t) => t.id === taskId);
    if (task && !canUserManageTask(task)) {
      e.preventDefault();
      toast.error('Only the task creator, room host, or moderator can move this task');
      return;
    }

    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggingTaskId(null);
    setDragOverColumnId(null);
    e.currentTarget.style.opacity = '1';
  };

  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, colId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== colId) {
      setDragOverColumnId(colId);
    }
  };

  const handleColumnDragLeave = (e: React.DragEvent<HTMLDivElement>, colId: TaskStatus) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumnId === colId) {
      setDragOverColumnId(null);
    }
  };

  const handleColumnDrop = (e: React.DragEvent<HTMLDivElement>, colId: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDragOverColumnId(null);
    setDraggingTaskId(null);

    if (taskId) {
      const task = localTasks.find((t) => t.id === taskId);
      if (task && !canUserManageTask(task)) {
        toast.error('Only the task creator, room host, or moderator can move this task');
        return;
      }
      handleMoveTaskStatus(taskId, colId);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center flex-1 min-h-[350px] p-8 text-center space-y-3 card-subtle rounded-2xl', className)}>
        <Loader2 className="w-7 h-7 text-accent animate-spin" />
        <p className="text-xs font-medium text-foreground-muted">Loading workspace tasks...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('flex flex-col h-full min-h-0 w-full overflow-hidden gap-2 sm:gap-2.5', className)}>
      {/* Redesigned Task Filter & Sprint Progress Strip */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-surface/90 backdrop-blur-xl border border-border/80 shadow-xs space-y-2.5 shrink-0 transition-colors duration-200">
        {/* Top Controls: Search Input, Priority Filter Pills, & Single Authoritative Add Task */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-2.5">
          {/* Search Box with dynamic clear button */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter tasks by title, description, or assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8.5 pr-8 text-xs text-foreground placeholder:text-foreground-muted bg-surface-subtle hover:bg-surface-elevated/70 border border-border rounded-xl focus:border-accent focus:ring-1 focus:ring-accent/30 focus:outline-hidden transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground p-0.5 rounded-full hover:bg-surface transition-colors cursor-pointer"
                title="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Priority Filter Segmented Chips (clean without redundant counts) */}
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto pb-0.5 sm:pb-0">
            {[
              { id: 'ALL', label: 'All', dot: null },
              { id: 'URGENT', label: 'Urgent', dot: 'bg-rose-500' },
              { id: 'HIGH', label: 'High', dot: 'bg-orange-500' },
              { id: 'MEDIUM', label: 'Med', dot: 'bg-amber-400' },
              { id: 'LOW', label: 'Low', dot: 'bg-slate-400' },
            ].map((p) => {
              const isSelected = priorityFilter === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriorityFilter(p.id)}
                  className={cn(
                    'h-8 px-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border select-none active:scale-95',
                    isSelected
                      ? 'bg-accent text-white border-accent shadow-xs font-semibold'
                      : 'bg-surface-subtle hover:bg-surface-elevated text-foreground-secondary border-border/70 hover:border-accent/40 hover:text-foreground'
                  )}
                  title={`Filter by ${p.label} priority`}
                >
                  {p.dot && (
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        isSelected ? 'bg-white' : p.dot
                      )}
                    />
                  )}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Single Authoritative Add Task CTA */}
          {onOpenCreateModal && (
            <Button
              onClick={onOpenCreateModal}
              size="sm"
              className="h-8 px-3.5 btn-primary bg-accent hover:bg-accent-hover active:scale-95 text-white shadow-xs rounded-xl font-semibold text-xs gap-1.5 whitespace-nowrap cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </Button>
          )}
        </div>

        {/* Clean Sprint Progress Strip without duplicate column status counts */}
        <div className="pt-2 border-t border-border/50 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Sprint Progress</span>
            </span>

            {/* Resolution Counter & Percent Badge */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-foreground-secondary text-[11px]">
                <strong className="text-foreground font-semibold">{completedTasksCount}</strong>/{totalTasksCount} resolved
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs">
                {progressPercent}%
              </span>
            </div>
          </div>

          {/* Animated GSAP Completion Progress Bar Track */}
          <div className="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden border border-border/70 relative shadow-inner">
            <div
              ref={progressBarRef}
              className="h-full bg-linear-to-r from-accent via-sky-400 to-emerald-400 rounded-full transition-none relative shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Column Tabs Bar (< md) */}
      <div className="flex md:hidden items-center p-1 bg-surface-subtle/90 rounded-xl border border-border/80 gap-1 shrink-0">
        {KANBAN_COLUMNS.map((col) => {
          const colTasksCount = filteredTasks.filter((t) => t.status === col.id).length;
          const isActive = activeMobileColumn === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setActiveMobileColumn(col.id)}
              className={cn(
                'flex-1 py-1.5 px-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer relative min-w-0',
                isActive
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-elevated/40'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  isActive ? 'bg-white' : col.dotColor
                )}
              />
              <span className="truncate text-[11px] font-medium">
                {col.id === 'IN_PROGRESS' ? 'In Prog' : col.id === 'COMPLETED' ? 'Done' : col.title}
              </span>
              <span
                className={cn(
                  'text-[9px] font-mono px-1.5 py-0.2 rounded-full shrink-0',
                  isActive
                    ? 'bg-black/25 text-white'
                    : 'bg-surface text-foreground-muted border border-border/60'
                )}
              >
                {colTasksCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Active Column View (< md) */}
      <div className="flex-1 min-h-0 flex flex-col md:hidden overflow-hidden">
        {(() => {
          const activeCol = KANBAN_COLUMNS.find((c) => c.id === activeMobileColumn) || KANBAN_COLUMNS[0];
          const colTasks = filteredTasks.filter((t) => t.status === activeCol.id);

          return (
            <div className="flex flex-col bg-surface/75 rounded-xl p-2.5 sm:p-3 h-full min-h-0 backdrop-blur-md shadow-2xs border border-border/80 overflow-hidden">
              {/* Active Column Subheader */}
              <div className="flex items-center justify-between mb-2 shrink-0 pb-1.5 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', activeCol.dotColor)} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {activeCol.title}
                  </h3>
                  <span
                    className={cn(
                      'text-[10px] font-mono px-1.5 py-0.2 rounded-full border font-bold',
                      activeCol.badgeStyle
                    )}
                  >
                    {colTasks.length} {colTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>

                {onOpenCreateModal && (
                  <button
                    type="button"
                    onClick={onOpenCreateModal}
                    className="text-[11px] text-accent font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Task</span>
                  </button>
                )}
              </div>

              {/* Tasks List Container with native smooth touch scrolling */}
              <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-xl text-center p-4">
                    <p className="text-xs text-foreground-muted">
                      No tasks in {activeCol.title.toLowerCase()}
                    </p>
                    {onOpenCreateModal && (
                      <button
                        type="button"
                        onClick={onOpenCreateModal}
                        className="mt-2 text-xs font-semibold text-accent hover:underline cursor-pointer"
                      >
                        + Create task
                      </button>
                    )}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <KanbanTaskCard
                      key={task.id}
                      task={task}
                      isDragging={draggingTaskId === task.id}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onMoveStatus={handleMoveTaskStatus}
                      onDelete={showDelete && onDeleteTask ? handleDeleteTask : undefined}
                      onEdit={(t) => setEditingTask(t)}
                      onClaim={handleClaimTask}
                      currentUserId={currentUserId}
                      canManage={canUserManageTask(task)}
                      canDelete={canUserDeleteTask(task)}
                      isClaiming={claimingTaskIds.has(task.id)}
                      showRoomLink={showRoomLink}
                      isActiveFocus={activeTaskId === task.id}
                      onSelectFocus={onSelectFocusTask}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Desktop 4-Column Draggable Kanban Board Grid (>= md) */}
      <div className="hidden md:grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3 flex-1 min-h-0 overflow-hidden">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isTargeted = dragOverColumnId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleColumnDragOver(e, col.id)}
              onDragLeave={(e) => handleColumnDragLeave(e, col.id)}
              onDrop={(e) => handleColumnDrop(e, col.id)}
              className={cn(
                'flex flex-col bg-surface/75 rounded-xl p-2.5 sm:p-3 h-full min-h-0 transition-all duration-200 backdrop-blur-md shadow-2xs border overflow-hidden',
                isTargeted
                  ? col.dropBorder
                  : 'border-border/80 hover:border-accent/40'
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn('w-2 h-2 rounded-full', col.dotColor)} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {col.title}
                  </h3>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.2 rounded-full border font-bold',
                    col.badgeStyle
                  )}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Column Task Drop Zone / Card List */}
              <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-0.5">
                {colTasks.length === 0 ? (
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center h-36 border border-dashed rounded-xl text-center p-3 transition-colors',
                      isTargeted
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-foreground-muted'
                    )}
                  >
                    <p className="text-xs">
                      {isTargeted ? 'Drop card here' : `No tasks in ${col.title.toLowerCase()}`}
                    </p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <KanbanTaskCard
                      key={task.id}
                      task={task}
                      isDragging={draggingTaskId === task.id}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onMoveStatus={handleMoveTaskStatus}
                      onDelete={showDelete && onDeleteTask ? handleDeleteTask : undefined}
                      onEdit={(t) => setEditingTask(t)}
                      onClaim={handleClaimTask}
                      currentUserId={currentUserId}
                      canManage={canUserManageTask(task)}
                      canDelete={canUserDeleteTask(task)}
                      isClaiming={claimingTaskIds.has(task.id)}
                      showRoomLink={showRoomLink}
                      isActiveFocus={activeTaskId === task.id}
                      onSelectFocus={onSelectFocusTask}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Editing Tasks */}
      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleSaveEditedTask}
        task={editingTask}
        members={members}
      />
    </div>
  );
};

// Tactile 3D Perspective Kanban Task Card
interface KanbanTaskCardProps {
  task: Task;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onClaim?: (taskId: string) => Promise<any> | void;
  currentUserId?: string;
  canManage?: boolean;
  canDelete?: boolean;
  isClaiming?: boolean;
  showRoomLink?: boolean;
  isActiveFocus?: boolean;
  onSelectFocus?: (task: Task) => void;
}

const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
  onMoveStatus,
  onDelete,
  onEdit,
  onClaim,
  currentUserId,
  canManage = true,
  canDelete = true,
  isClaiming = false,
  showRoomLink = false,
  isActiveFocus = false,
  onSelectFocus,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const isAssignedToCurrentUser = Boolean(
    currentUserId &&
      (task.assigneeId === currentUserId || task.assignee?.id === currentUserId)
  );

  const priorityStyles: Record<
    TaskPriority,
    { label: string; badge: string; glow: string }
  > = {
    LOW: {
      label: 'LOW',
      badge: 'bg-surface-subtle text-foreground-muted border-border',
      glow: 'hover:border-border-focus/40',
    },
    MEDIUM: {
      label: 'MEDIUM',
      badge: 'bg-accent/15 text-accent border-accent/30',
      glow: 'hover:border-accent/40',
    },
    HIGH: {
      label: 'HIGH',
      badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      glow: 'hover:border-amber-500/40',
    },
    URGENT: {
      label: 'URGENT',
      badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      glow: 'hover:border-rose-500/40',
    },
  };

  const statusOrder: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'COMPLETED'];
  const currentIndex = statusOrder.indexOf(task.status);
  const prevStatus = currentIndex > 0 ? statusOrder[currentIndex - 1] : null;
  const nextStatus = currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null;

  const pConfig = priorityStyles[task.priority] || priorityStyles.MEDIUM;

  const isCompleted = task.status === 'COMPLETED';

  // Animated top highlight bar color based on completion or priority
  const topBorderClass = isCompleted
    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
    : task.priority === 'URGENT'
    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
    : task.priority === 'HIGH'
    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
    : task.priority === 'LOW'
    ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
    : 'bg-accent shadow-[0_0_8px_rgba(63,114,175,0.6)]';

  return (
    <div
      id={`kanban-card-${task.id}`}
      ref={cardRef}
      draggable={canManage}
      onDragStart={canManage ? onDragStart : undefined}
      onDragEnd={canManage ? onDragEnd : undefined}
      className={cn(
        'group relative overflow-hidden rounded-xl p-2.5 sm:p-3 transition-all duration-200 shadow-2xs border select-none',
        isCompleted
          ? 'bg-surface-elevated/70 hover:bg-surface-elevated border-border/70 hover:border-emerald-500/50'
          : 'bg-surface-elevated/90 hover:bg-surface-elevated border-border hover:border-accent/60',
        canManage ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        isDragging && 'opacity-40 scale-[1.02] shadow-2xl rotate-1 border-accent ring-2 ring-accent/40',
        !isCompleted && pConfig.glow
      )}
    >
      {/* Interactive animated top border highlight based on priority or completion */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-[2px] rounded-t-xl transition-transform duration-200 ease-out origin-left pointer-events-none scale-x-0 group-hover:scale-x-100',
          topBorderClass
        )}
      />

      {/* Priority Pill & Card Actions Header */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>DONE</span>
            </span>
          ) : null}

          <span
            className={cn(
              'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0',
              pConfig.badge
            )}
          >
            {pConfig.label}
          </span>

          {isActiveFocus && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-accent bg-accent/15 border border-accent/30 px-1.5 py-0.5 rounded animate-pulse shrink-0">
              <Target className="w-2.5 h-2.5" />
              <span>Focusing</span>
            </span>
          )}
        </div>

        {/* Action Buttons: on desktop visible on hover, on mobile visible by default */}
        <div className="flex items-center gap-1 shrink-0">
          {onSelectFocus && !isActiveFocus && (
            <button
              type="button"
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSelectFocus(task);
              }}
              className="text-foreground-muted hover:text-accent hover:bg-accent/10 p-1 rounded-md transition-colors cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100"
              title="Set as Pomodoro focus target"
            >
              <Target className="w-3 h-3" />
            </button>
          )}

          {canManage && (
            <>
              <GripVertical className="w-3 h-3 text-foreground-muted/60 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0" />
              {onEdit && (
                <button
                  type="button"
                  draggable={false}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  className="text-foreground-muted hover:text-accent hover:bg-accent/10 p-1 rounded-md transition-colors cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  title="Edit task"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  type="button"
                  draggable={false}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  className="text-foreground-muted hover:text-rose-500 hover:bg-rose-500/10 p-1 rounded-md transition-colors cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  title="Delete task"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="flex items-start gap-1.5 min-w-0">
        {isCompleted && (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
        )}
        <h4
          className={cn(
            'text-xs font-semibold leading-snug flex-1 min-w-0',
            isCompleted
              ? 'text-foreground-muted line-through decoration-foreground-muted/60'
              : 'text-foreground'
          )}
          title={task.title}
        >
          {task.title}
        </h4>
      </div>

      {/* Description */}
      {task.description && (
        <p
          className={cn(
            'text-[11px] mt-1 line-clamp-2 leading-relaxed',
            isCompleted ? 'text-foreground-muted/75' : 'text-foreground-secondary'
          )}
        >
          {task.description}
        </p>
      )}

      {/* Assignee & Meta Strip */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-border/40 text-[10px] text-foreground-muted">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.assignee ? (
            <div className="flex items-center gap-1.5 min-w-0">
              {task.assignee.avatarUrl ? (
                <img
                  src={task.assignee.avatarUrl}
                  alt={task.assignee.name}
                  className="w-4 h-4 rounded-full object-cover border border-border shrink-0"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-[8px] text-accent font-bold shrink-0">
                  {task.assignee.name.charAt(0)}
                </div>
              )}
              {isAssignedToCurrentUser ? (
                <span className="inline-flex items-center text-[9px] font-semibold text-accent bg-accent/10 px-1.5 py-0.2 rounded border border-accent/20 shrink-0">
                  You
                </span>
              ) : (
                <span className="truncate max-w-24 text-foreground-secondary text-[10px] font-medium">
                  {task.assignee.name}
                </span>
              )}
            </div>
          ) : onClaim ? (
            <button
              type="button"
              draggable={false}
              disabled={isClaiming}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onClaim(task.id);
              }}
              className={cn(
                'inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer shadow-2xs select-none',
                isClaiming
                  ? 'bg-accent/20 text-accent border-accent/40 cursor-wait opacity-80'
                  : 'bg-accent/15 text-accent hover:bg-accent hover:text-white border-accent/30 active:scale-95'
              )}
              title="Assign this task to yourself"
            >
              {isClaiming ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0" />
              ) : (
                <UserPlus className="w-2.5 h-2.5 shrink-0" />
              )}
              <span>{isClaiming ? 'Assigning...' : 'Assign to me'}</span>
            </button>
          ) : (
            <span className="text-foreground-muted flex items-center gap-1 text-[10px]">
              <User className="w-3 h-3" /> Unassigned
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {task.dueDate && (
            <span
              className="flex items-center gap-1 text-foreground-muted font-mono text-[9px] shrink-0"
              title={`Due: ${format(new Date(task.dueDate), 'PPP')}`}
            >
              <Clock className="w-2.5 h-2.5 text-accent" />
              <span>{format(new Date(task.dueDate), 'MMM d')}</span>
            </span>
          )}
          {showRoomLink && task.roomId && (
            <Link
              href={`/rooms/${task.roomId}`}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-[9px] text-accent hover:text-accent-hover font-medium bg-accent/10 hover:bg-accent/20 px-1.5 py-0.5 rounded border border-accent/25 transition-colors shrink-0"
              title="View in Study Room"
            >
              <span>Room</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Quick Move Buttons: visible on mobile / small-width displays (< md), hidden on desktop where drag & drop is active */}
      {canManage && (prevStatus || nextStatus) && (
        <div
          className="flex md:hidden items-center justify-between gap-1.5 mt-2 pt-1.5 border-t border-border/40 text-[10px] font-mono text-foreground-muted"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {prevStatus ? (
            <button
              type="button"
              draggable={false}
              onClick={(e) => {
                e.stopPropagation();
                onMoveStatus(task.id, prevStatus);
              }}
              className="inline-flex items-center gap-1 bg-surface-subtle hover:bg-surface-elevated active:scale-95 py-1 px-2 rounded-md transition-all cursor-pointer text-foreground-muted hover:text-foreground border border-border/70 text-[10px]"
              title={`Move to ${prevStatus.replace('_', ' ')}`}
            >
              <ArrowLeft className="w-2.5 h-2.5" />
              <span>{isCompleted ? 'Reopen' : prevStatus.replace('_', ' ')}</span>
            </button>
          ) : (
            <div />
          )}

          {nextStatus && (
            <button
              type="button"
              draggable={false}
              onClick={(e) => {
                e.stopPropagation();
                onMoveStatus(task.id, nextStatus);
              }}
              className="inline-flex items-center gap-1 bg-accent/15 hover:bg-accent hover:text-white active:scale-95 py-1 px-2.5 rounded-md transition-all cursor-pointer ml-auto text-accent font-semibold border border-accent/30 text-[10px]"
              title={`Move to ${nextStatus.replace('_', ' ')}`}
            >
              <span>{nextStatus.replace('_', ' ')}</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
