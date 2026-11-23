'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { apiRequest } from '../../lib/api';
import { Task, TaskStatus } from '@studyflow/shared';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  ArrowRight,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { triggerConfetti } from '../../lib/confetti';
import { playTaskCompletionSound } from '../../lib/audio';
import { TaskCard } from '../../components/tasks/TaskCard';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'BACKLOG', title: 'Backlog', color: 'bg-zinc-400' },
  { id: 'TODO', title: 'To Do', color: 'bg-amber-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-accent' },
  { id: 'COMPLETED', title: 'Completed', color: 'bg-emerald-400' },
];

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await apiRequest<Task[]>('/tasks/my');
        setTasks(data);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  const handleToggleComplete = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      const updated = await apiRequest<Task>(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      if (nextStatus === 'COMPLETED') {
        triggerConfetti({ particleCount: 70 });
        playTaskCompletionSound();
        toast.success('Task marked as completed! 🎉');
      } else {
        toast.success('Task reopened');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task');
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updated = await apiRequest<Task>(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (newStatus === 'COMPLETED') {
        triggerConfetti({ particleCount: 60 });
        playTaskCompletionSound();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Task deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete task');
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
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="heading-page">My Tasks</h1>
            <p className="subheading-page">
              Collaborative action items assigned to you or created across all active study rooms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-surface-subtle p-1 rounded-xl border border-border">
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
            </div>
          </div>
        </div>

        {/* Progress & Filter Bar */}
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

              {viewMode === 'list' && (
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
              )}

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
              className="h-full bg-gradient-to-r from-accent to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Tasks View: List or Board */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 card-subtle border-dashed">
            <Sparkles className="w-8 h-8 text-accent mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-foreground">No tasks found matching your filter.</p>
            <p className="text-xs text-foreground-muted mt-1">
              Join a study room to assign tasks and collaborate with teammates.
            </p>
          </div>
        ) : viewMode === 'list' ? (
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
                      <span>Assigned to {task.assignee?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
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
        ) : (
          /* Kanban Board View */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);

              return (
                <div
                  key={col.id}
                  className="flex flex-col bg-surface border border-border rounded-2xl p-3.5 min-h-[400px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.color}`} />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {col.title}
                      </h3>
                    </div>
                    <span className="text-xs text-foreground-muted font-mono bg-surface-elevated px-2 py-0.5 rounded-full border border-border">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
                    {colTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-28 border border-dashed border-border-subtle rounded-xl text-center p-3 text-xs text-foreground-muted">
                        No tasks in {col.title.toLowerCase()}
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onUpdateStatus={handleUpdateStatus}
                          onDelete={handleDeleteTask}
                          canDelete={true}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
