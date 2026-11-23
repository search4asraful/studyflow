'use client';

import { useGSAP } from '@gsap/react';
import { Task, TaskPriority, TaskStatus } from '@studyflow/shared';
import { format } from 'date-fns';
import gsap from 'gsap';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock,
    Filter,
    GripVertical,
    Plus,
    Search,
    Trash2,
    User,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { playTaskCompletionSound } from '../../lib/audio';
import { triggerConfetti } from '../../lib/confetti';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

export interface WorkspaceKanbanProps {
  tasks?: Task[];
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
  onOpenCreateModal?: () => void;
  onActivityLog?: (action: string, details?: string) => void;
  className?: string;
}

// 8 Realistic Group Astro engineering workspace tasks (2 in each column)
export const INITIAL_ASTRO_TASKS: Task[] = [
  {
    id: 'astro-task-1',
    roomId: 'SD3ASTRO',
    title: 'Telemetry streaming pipeline refactor',
    description: 'Upgrade WebRTC telemetry data channels to bidirectional binary protobuf frames with zero frame dropping.',
    status: 'BACKLOG',
    priority: 'MEDIUM',
    assigneeId: 'elena-rostova',
    assignee: {
      id: 'elena-rostova',
      name: 'Elena Rostova',
      email: 'elena.r@astro.io',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
    createdById: 'owner-1',
    dueDate: '2026-11-28',
    position: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'astro-task-2',
    roomId: 'SD3ASTRO',
    title: 'Ion drive power bus telemetry schema',
    description: 'Define CAN bus high-voltage discharge threshold alerts and real-time state machine monitors.',
    status: 'BACKLOG',
    priority: 'LOW',
    assigneeId: 'sarah-chen',
    assignee: {
      id: 'sarah-chen',
      name: 'Dr. Sarah Chen',
      email: 'sarah.chen@astro.io',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
    createdById: 'owner-1',
    dueDate: '2026-12-02',
    position: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'astro-task-3',
    roomId: 'SD3ASTRO',
    title: 'Thermal dissipation model verification',
    description: 'Validate finite element analysis boundary conditions against radiator vacuum chamber sensor data.',
    status: 'TODO',
    priority: 'URGENT',
    assigneeId: 'marcus-vance',
    assignee: {
      id: 'marcus-vance',
      name: 'Marcus Vance',
      email: 'marcus.v@astro.io',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
    createdById: 'owner-1',
    dueDate: '2026-11-25',
    position: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'astro-task-4',
    roomId: 'SD3ASTRO',
    title: 'Reaction wheel PID controller tuning',
    description: 'Mitigate angular momentum saturation under 3-axis disturbance torques during orbit transfer maneuver.',
    status: 'TODO',
    priority: 'HIGH',
    assigneeId: 'asraful-islam',
    assignee: {
      id: 'asraful-islam',
      name: 'Md. Asraful Islam',
      email: 'asraful@studyflow.dev',
      avatarUrl: '',
      createdAt: new Date().toISOString(),
    },
    createdById: 'owner-1',
    dueDate: '2026-11-26',
    position: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'astro-task-5',
    roomId: 'SD3ASTRO',
    title: 'Star tracker optical calibration loop',
    description: 'Run quaternions solver and centroid tracking matrix through synthetic deep-space star field test suite.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assigneeId: 'sarah-chen',
    assignee: {
      id: 'sarah-chen',
      name: 'Dr. Sarah Chen',
      email: 'sarah.chen@astro.io',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
    createdById: 'owner-1',
    dueDate: '2026-11-24',
    position: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'astro-task-6',
    roomId: 'SD3ASTRO',
    title: 'GSAP HUD spatial depth shader integration',
    description: 'Choreograph telemetry instrument dials and tactile perspective transforms on card focus states.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    assigneeId: 'asraful-islam',
    assignee: {
      id: 'asraful-islam',
      name: 'Md. Asraful Islam',
      email: 'asraful@studyflow.dev',
      avatarUrl: '',
      createdAt: new Date().toISOString(),
    },
    createdById: 'owner-1',
    dueDate: '2026-11-23',
    position: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'astro-task-7',
    roomId: 'SD3ASTRO',
    title: 'Solar array deployment actuator tests',
    description: 'Verified motorized hinge drive telemetry with zero torque overshoot across 12 full cycles.',
    status: 'COMPLETED',
    priority: 'HIGH',
    assigneeId: 'marcus-vance',
    assignee: {
      id: 'marcus-vance',
      name: 'Marcus Vance',
      email: 'marcus.v@astro.io',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
    createdById: 'owner-1',
    dueDate: '2026-11-21',
    position: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'astro-task-8',
    roomId: 'SD3ASTRO',
    title: 'Orbital rendezvous trajectory simulation',
    description: 'Clohessy-Wiltshire relative motion equations checked for low-fuel station-keeping rendezvous.',
    status: 'COMPLETED',
    priority: 'LOW',
    assigneeId: 'elena-rostova',
    assignee: {
      id: 'elena-rostova',
      name: 'Elena Rostova',
      email: 'elena.r@astro.io',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
    createdById: 'owner-1',
    dueDate: '2026-11-20',
    position: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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
  onUpdateTask,
  onDeleteTask,
  onOpenCreateModal,
  onActivityLog,
  className = '',
}) => {
  // Use prop tasks if provided, otherwise fall back to demo tasks
  const [localTasks, setLocalTasks] = useState<Task[]>(() => {
    return propTasks !== undefined ? propTasks : INITIAL_ASTRO_TASKS;
  });

  // Keep synced if propTasks changes from socket
  useEffect(() => {
    if (propTasks !== undefined) {
      setLocalTasks(propTasks);
    }
  }, [propTasks]);

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<TaskStatus | null>(null);
  const [activeMobileColumn, setActiveMobileColumn] = useState<TaskStatus>('TODO');

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

  // Overall Task Progress calculations
  const totalTasksCount = localTasks.length;
  const completedTasksCount = localTasks.filter((t) => t.status === 'COMPLETED').length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

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

    const oldStatus = task.status;
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

    // Activity log notification
    if (onActivityLog) {
      const colName = KANBAN_COLUMNS.find((c) => c.id === newStatus)?.title || newStatus;
      onActivityLog('TASK_UPDATED', `Moved "${task.title}" to ${colName}`);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = localTasks.find((t) => t.id === taskId);
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
      handleMoveTaskStatus(taskId, colId);
    }
  };

  return (
    <div ref={containerRef} className={cn('flex flex-col h-full min-h-0 w-full overflow-hidden gap-2 sm:gap-2.5', className)}>
      {/* Task Filter & Overall Progress Strip */}
      <div className="p-2 sm:p-2.5 rounded-xl bg-surface/90 border border-border/80 shadow-xs space-y-1.5 shrink-0 transition-colors duration-200">
        <div className="flex items-center justify-between gap-2">
          {/* Search & Priority Filter Controls */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-2.5 text-xs text-foreground placeholder:text-foreground-muted bg-surface-subtle border border-border rounded-lg focus:border-accent focus:outline-hidden transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-foreground-muted hidden xs:inline" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 bg-surface-subtle border border-border focus:border-accent rounded-lg px-2 text-xs text-foreground outline-hidden transition-colors cursor-pointer"
            >
              <option value="ALL">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Med</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urg</option>
            </select>
          </div>

          {/* Add Room Task CTA Button */}
          <Button
            onClick={() => {
              if (onOpenCreateModal) onOpenCreateModal();
            }}
            size="sm"
            className="h-8 px-2.5 sm:px-3 btn-primary bg-accent hover:bg-accent-hover active:scale-95 text-white shadow-xs rounded-lg font-semibold text-xs gap-1.5 whitespace-nowrap cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Add Task</span>
            <span className="xs:hidden">Task</span>
          </Button>
        </div>

        {/* Overall Task Progress Strip */}
        <div className="space-y-0.5 pt-0.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-foreground-secondary">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="font-semibold tracking-wide text-foreground">Progress</span>
            </span>
            <span ref={progressPercentTextRef} className="font-bold text-foreground">
              {completedTasksCount}/{totalTasksCount} resolved ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-1 bg-surface-subtle rounded-full overflow-hidden border border-border-subtle relative">
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
                      onDelete={handleDeleteTask}
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
                      onDelete={handleDeleteTask}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
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
  onDelete: (taskId: string) => void;
}

const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
  onMoveStatus,
  onDelete,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

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

  // Ultra-compact card view specifically for COMPLETED tasks
  if (task.status === 'COMPLETED') {
    return (
      <div
        id={`kanban-card-${task.id}`}
        ref={cardRef}
        draggable={true}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={cn(
          'group relative overflow-hidden bg-surface/50 hover:bg-surface-elevated/80 border border-border-subtle hover:border-emerald-500/40 rounded-xl p-2.5 transition-all duration-200 cursor-grab active:cursor-grabbing shadow-2xs opacity-85 hover:opacity-100',
          isDragging && 'opacity-40 scale-[1.02] shadow-2xl rotate-1 border-accent ring-2 ring-accent/40'
        )}
      >
        {/* Interactive animated top border highlight */}
        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-transform duration-200 ease-out origin-left pointer-events-none scale-x-0 group-hover:scale-x-100" />
        {/* Completed Compact Primary Row */}
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <h4
            className="text-xs font-medium text-foreground-muted line-through truncate flex-1 min-w-0"
            title={task.title}
          >
            {task.title}
          </h4>
          <span
            className={cn(
              'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0',
              pConfig.badge
            )}
          >
            {pConfig.label}
          </span>
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="text-foreground-muted hover:text-rose-500 hover:bg-rose-500/10 p-0.5 rounded transition-colors cursor-pointer"
              title="Delete task"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Completed Compact Bottom Row: Assignee + Reopen */}
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-foreground-muted font-mono">
          <div className="flex items-center gap-1 min-w-0">
            {task.assignee ? (
              <div className="flex items-center gap-1 min-w-0">
                {task.assignee.avatarUrl ? (
                  <img
                    src={task.assignee.avatarUrl}
                    alt={task.assignee.name}
                    className="w-3.5 h-3.5 rounded-full object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-[8px] text-accent font-bold shrink-0">
                    {task.assignee.name.charAt(0)}
                  </div>
                )}
                <span className="truncate max-w-20 text-[10px] text-foreground-muted">
                  {task.assignee.name.split(' ')[0]}
                </span>
              </div>
            ) : (
              <span>Unassigned</span>
            )}
          </div>

          {prevStatus && (
            <button
              type="button"
              draggable={false}
              onClick={(e) => {
                e.stopPropagation();
                onMoveStatus(task.id, prevStatus);
              }}
              className="inline-flex items-center gap-1 bg-surface-subtle hover:bg-surface-elevated active:scale-95 py-0.5 px-2 rounded-md transition-all cursor-pointer text-foreground-muted hover:text-accent border border-border/60 text-[10px]"
              title={`Reopen to ${prevStatus.replace('_', ' ')}`}
            >
              <ArrowLeft className="w-2.5 h-2.5" />
              <span>Reopen</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Compact card view for Active tasks (BACKLOG, TO DO, IN PROGRESS)
  return (
    <div
      id={`kanban-card-${task.id}`}
      ref={cardRef}
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative overflow-hidden bg-surface-elevated/90 hover:bg-surface-elevated border border-border hover:border-accent/60 rounded-xl p-2.5 sm:p-3 transition-all duration-200 cursor-grab active:cursor-grabbing shadow-2xs',
        isDragging && 'opacity-40 scale-[1.02] shadow-2xl rotate-1 border-accent ring-2 ring-accent/40',
        pConfig.glow
      )}
    >
      {/* Interactive animated top border highlight based on priority */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-[2px] rounded-t-xl transition-transform duration-200 ease-out origin-left pointer-events-none scale-x-0 group-hover:scale-x-100',
          task.priority === 'URGENT'
            ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
            : task.priority === 'HIGH'
            ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
            : task.priority === 'LOW'
            ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
            : 'bg-accent shadow-[0_0_8px_rgba(63,114,175,0.6)]'
        )}
      />
      {/* Priority Pill & Card Actions Header */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={cn(
            'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border',
            pConfig.badge
          )}
        >
          {pConfig.label}
        </span>

        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3 h-3 text-foreground-muted cursor-grab" />
          <button
            type="button"
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="text-foreground-muted hover:text-rose-500 hover:bg-rose-500/10 p-0.5 rounded transition-colors cursor-pointer"
            title="Delete task"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-foreground leading-snug">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-[11px] text-foreground-secondary mt-1 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Assignee & Due Date Strip */}
      <div className="flex items-center justify-between mt-2 text-[10px] text-foreground-muted">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.assignee ? (
            <div className="flex items-center gap-1 min-w-0">
              {task.assignee.avatarUrl ? (
                <img
                  src={task.assignee.avatarUrl}
                  alt={task.assignee.name}
                  className="w-3.5 h-3.5 rounded-full object-cover border border-border shrink-0"
                />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-[8px] text-accent font-bold shrink-0">
                  {task.assignee.name.charAt(0)}
                </div>
              )}
              <span className="truncate max-w-22.5 text-foreground-secondary text-[10px]">
                {task.assignee.name}
              </span>
            </div>
          ) : (
            <span className="text-foreground-muted flex items-center gap-1 text-[10px]">
              <User className="w-3 h-3" /> Unassigned
            </span>
          )}
        </div>

        {task.dueDate && (
          <span className="flex items-center gap-1 text-foreground-muted font-mono text-[9px] shrink-0">
            <Clock className="w-2.5 h-2.5 text-accent" />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      {/* Quick Move Status Arrows for Tactile / Mobile Touch Access */}
      <div
        className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/40 text-[10px] font-mono text-foreground-muted"
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
            <span>{prevStatus.replace('_', ' ')}</span>
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
    </div>
  );
};
