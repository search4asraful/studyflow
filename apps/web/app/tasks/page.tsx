'use client';

import { StudyRoom, Task, TaskStatus } from '@studyflow/shared';
import { format } from 'date-fns';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AppShell } from '../../components/layout/AppShell';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { EditTaskModal } from '../../components/tasks/EditTaskModal';
import { WorkspaceKanban } from '../../components/tasks/WorkspaceKanban';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  apiRequest,
  cachedApiRequest,
  mutateApiCache,
  invalidateApiCache,
  subscribeToRevalidation,
} from '../../lib/api';
import { playTaskCompletionSound } from '../../lib/audio';
import { triggerConfetti } from '../../lib/confetti';
import { useAuthStore } from '../../stores/authStore';

export default function MyTasksPage() {
  const user = useAuthStore((s) => s.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const tasksRef = useRef<Task[]>([]);
  tasksRef.current = tasks;

  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [tasksData, roomsData] = await Promise.all([
          cachedApiRequest<Task[]>('/tasks/my'),
          cachedApiRequest<StudyRoom[]>('/rooms').catch(() => []),
        ]);
        if (active) {
          setTasks(tasksData);
          tasksRef.current = tasksData;
          setRooms(roomsData);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          toast.error(err.message || 'Failed to load tasks');
          setLoading(false);
        }
      }
    }
    loadData();

    // SWR revalidation listeners
    const unsub1 = subscribeToRevalidation<Task[]>('/tasks/my', (data) => {
      if (active && Array.isArray(data)) {
        setTasks(data);
        tasksRef.current = data;
      }
    });
    const unsub2 = subscribeToRevalidation<StudyRoom[]>('/rooms', (data) => {
      if (active && data) setRooms(data);
    });

    return () => {
      active = false;
      unsub1();
      unsub2();
    };
  }, []);

  const handleToggleComplete = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const taskId = task.id;
    const originalTask = tasksRef.current.find((t) => t.id === taskId) || task;

    // 1. Instant 0ms Optimistic UI update
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t));
      tasksRef.current = next;
      return next;
    });

    // 2. Instant sensory feedback
    if (nextStatus === 'COMPLETED') {
      triggerConfetti({ particleCount: 70 });
      playTaskCompletionSound();
      toast.success('Task marked as completed! 🎉');
    } else {
      toast.info('Task reopened');
    }

    // 3. Mutate cache optimistically
    mutateApiCache<Task[]>('/tasks/my', (cached) => {
      const base = Array.isArray(cached) && cached.length > 0 ? cached : tasksRef.current;
      return base.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t));
    });

    // 4. Background network sync with rollback on failure
    try {
      const updated = await apiRequest<Task>(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === taskId ? updated : t));
        tasksRef.current = next;
        return next;
      });
      mutateApiCache<Task[]>('/tasks/my', (cached) => {
        const base = Array.isArray(cached) && cached.length > 0 ? cached : tasksRef.current;
        return base.map((t) => (t.id === taskId ? updated : t));
      });
      invalidateApiCache('/analytics/summary');
    } catch (err: any) {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === taskId ? originalTask : t));
        tasksRef.current = next;
        return next;
      });
      mutateApiCache<Task[]>('/tasks/my', (cached) => {
        const base = Array.isArray(cached) && cached.length > 0 ? cached : tasksRef.current;
        return base.map((t) => (t.id === taskId ? originalTask : t));
      });
      toast.error(err.message || 'Failed to update task');
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    const originalTask = tasksRef.current.find((t) => t.id === taskId);
    if (!originalTask) return;

    // Optimistically attach assignee details if assigning to self or unassigning
    let optimisticUpdates = { ...updates };
    if (updates.assigneeId && user && updates.assigneeId === user.id) {
      optimisticUpdates = {
        ...optimisticUpdates,
        assignee: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl || null,
          bio: user.bio || null,
          createdAt: user.createdAt || new Date().toISOString(),
        },
      };
    } else if (updates.assigneeId === null) {
      optimisticUpdates = {
        ...optimisticUpdates,
        assignee: null,
      };
    }

    // 1. Instant optimistic update
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === taskId ? { ...t, ...optimisticUpdates } : t));
      tasksRef.current = next;
      return next;
    });
    mutateApiCache<Task[]>('/tasks/my', (cached) => {
      const base = Array.isArray(cached) && cached.length > 0 ? cached : tasksRef.current;
      return base.map((t) => (t.id === taskId ? { ...t, ...optimisticUpdates } : t));
    });

    // 2. Background sync with rollback
    try {
      const updated = await apiRequest<Task>(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === taskId ? updated : t));
        tasksRef.current = next;
        return next;
      });
      mutateApiCache<Task[]>('/tasks/my', (cached) => {
        const base = Array.isArray(cached) && cached.length > 0 ? cached : tasksRef.current;
        return base.map((t) => (t.id === taskId ? updated : t));
      });
      invalidateApiCache('/analytics/summary');
    } catch (err: any) {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === taskId ? originalTask : t));
        tasksRef.current = next;
        return next;
      });
      mutateApiCache<Task[]>('/tasks/my', (cached) => {
        const base = Array.isArray(cached) && cached.length > 0 ? cached : tasksRef.current;
        return base.map((t) => (t.id === taskId ? originalTask : t));
      });
      toast.error(err.message || 'Failed to update task');
    }
  };

  const handleClaimTask = async (taskId: string) => {
    const originalTask = tasksRef.current.find((t) => t.id === taskId);
    if (!originalTask) return;

    if (user) {
      const optimisticTask: Task = {
        ...originalTask,
        assigneeId: user.id,
        assignee: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl || null,
          bio: user.bio || null,
          createdAt: user.createdAt || new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === taskId ? optimisticTask : t));
        tasksRef.current = next;
        return next;
      });
      mutateApiCache<Task[]>('/tasks/my', (cached) => {
        const base = Array.isArray(cached) && cached.length > 0 ? cached : tasksRef.current;
        return base.map((t) => (t.id === taskId ? optimisticTask : t));
      });
    }

    try {
      const updated = await apiRequest<Task>(`/tasks/${taskId}/claim`, {
        method: 'POST',
      });
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === taskId ? updated : t));
        tasksRef.current = next;
        return next;
      });
      mutateApiCache<Task[]>('/tasks/my', (cached) => {
        const base = Array.isArray(cached) && cached.length > 0 ? cached : tasksRef.current;
        return base.map((t) => (t.id === taskId ? updated : t));
      });
      invalidateApiCache('/analytics/summary');
      toast.success('Task assigned to you! 🎉');
    } catch (err: any) {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === taskId ? originalTask : t));
        tasksRef.current = next;
        return next;
      });
      mutateApiCache<Task[]>('/tasks/my', (cached) => {
        const base = Array.isArray(cached) && cached.length > 0 ? cached : tasksRef.current;
        return base.map((t) => (t.id === taskId ? originalTask : t));
      });
      toast.error(err.message || 'Failed to assign task');
    }
  };

  const handleCreateTask = async (taskData: any) => {
    const targetRoomId = taskData.roomId || rooms[0]?.id;
    if (!targetRoomId) {
      toast.error('Please join or create a study room first.');
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      roomId: targetRoomId,
      title: taskData.title,
      description: taskData.description || null,
      status: taskData.status || 'TODO',
      priority: taskData.priority || 'MEDIUM',
      assigneeId: null,
      assignee: null,
      createdById: user?.id || 'me',
      dueDate: taskData.dueDate || null,
      position: tasksRef.current.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Instant optimistic add & close modal
    setTasks((prev) => {
      const next = [optimisticTask, ...prev];
      tasksRef.current = next;
      return next;
    });
    mutateApiCache<Task[]>('/tasks/my', (cached) => {
      const base = Array.isArray(cached) ? cached : tasksRef.current;
      return [optimisticTask, ...base];
    });
    setIsCreateModalOpen(false);
    toast.success('Task created! 🎉');

    // 2. Background network call
    try {
      const created = await apiRequest<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...taskData,
          roomId: targetRoomId,
        }),
      });
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === tempId ? created : t));
        tasksRef.current = next;
        return next;
      });
      mutateApiCache<Task[]>('/tasks/my', (cached) => {
        const base = Array.isArray(cached) ? cached : tasksRef.current;
        return base.map((t) => (t.id === tempId ? created : t));
      });
      invalidateApiCache('/analytics/summary');
    } catch (err: any) {
      setTasks((prev) => {
        const next = prev.filter((t) => t.id !== tempId);
        tasksRef.current = next;
        return next;
      });
      mutateApiCache<Task[]>('/tasks/my', (cached) => {
        const base = Array.isArray(cached) ? cached : tasksRef.current;
        return base.filter((t) => t.id !== tempId);
      });
      toast.error(err.message || 'Failed to create task');
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [tasks, statusFilter, priorityFilter, search]);

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="heading-page">My Tasks</h1>
            <p className="subheading-page">
              Collaborative action items assigned to you or created across all active study rooms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {rooms.length > 0 && viewMode === 'list' && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
                variant="primary"
                className="gap-1.5 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </Button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-surface-subtle p-1 rounded-xl border border-border">
              <button
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === 'board'
                    ? 'bg-accent text-white shadow-2xs font-semibold'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
                title="Kanban Board View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === 'list'
                    ? 'bg-accent text-white shadow-2xs font-semibold'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : viewMode === 'board' ? (
          /* Kanban Board View - Using Study Room Kanban Style */
          <div className="flex-1 min-h-[580px] flex flex-col">
            <WorkspaceKanban
              tasks={tasks}
              isLoading={loading}
              onUpdateTask={handleUpdateTask}
              onClaimTask={handleClaimTask}
              currentUserId={user?.id}
              onOpenCreateModal={rooms.length > 0 ? () => setIsCreateModalOpen(true) : undefined}
              showRoomLink={true}
              showDelete={false}
            />
          </div>
        ) : (
          /* List View */
          <div className="space-y-6">
            {/* Progress & Filter Bar for List View */}
            <div className="card-subtle p-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="input-base pl-9 py-2 text-xs"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input-base w-auto px-3 py-2 text-xs bg-surface text-foreground"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="input-base w-auto px-3 py-2 text-xs bg-surface text-foreground"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <span className="text-xs font-mono text-foreground-muted whitespace-nowrap">
                  {completedCount} of {tasks.length} Resolved ({progressPercent}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-accent to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-16 card-subtle border-dashed">
                <Sparkles className="w-8 h-8 text-accent mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-foreground">No tasks found matching your filter.</p>
                <p className="text-xs text-foreground-muted mt-1">
                  Join a study room to assign tasks and collaborate with teammates.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 card-interactive flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className="mt-0.5 text-foreground-muted hover:text-accent transition-colors"
                      >
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-sm font-bold ${
                              task.status === 'COMPLETED'
                                ? 'line-through text-foreground-muted'
                                : 'text-foreground'
                            }`}
                          >
                            {task.title}
                          </h3>
                          <Badge
                            size="sm"
                            variant={
                              task.priority === 'URGENT'
                                ? 'danger'
                                : task.priority === 'HIGH'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {task.priority}
                          </Badge>
                          <Badge size="sm" variant="secondary">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>

                        {task.description && (
                          <p className="text-xs text-foreground-secondary mt-1 line-clamp-1 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-foreground-muted mt-2">
                          {task.dueDate && (
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-accent" />
                              Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                            </span>
                          )}
                          <span>•</span>
                          {task.assignee ? (
                            task.assignee.id === user?.id || task.assigneeId === user?.id ? (
                              <span className="inline-flex items-center gap-1.5 text-accent font-medium">
                                {task.assignee.avatarUrl ? (
                                  <img
                                    src={task.assignee.avatarUrl}
                                    alt={task.assignee.name}
                                    className="w-3.5 h-3.5 rounded-full object-cover border border-border shrink-0"
                                  />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-[8px] text-accent font-bold shrink-0">
                                    {(task.assignee.name || user?.name || 'U').charAt(0)}
                                  </div>
                                )}
                                <span>On your plate</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-foreground-secondary">
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
                                <span>Assigned to {task.assignee.name}</span>
                              </span>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleClaimTask(task.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>Assign to me</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTask(task)}
                        className="gap-1.5 text-xs font-semibold"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                      <Link href={`/rooms/${task.roomId}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                          Study Room
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal for creating tasks */}
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTask}
          rooms={rooms}
        />

        {/* Modal for editing tasks in list view */}
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdateTask}
          task={editingTask}
        />
      </div>
    </AppShell>
  );
}
