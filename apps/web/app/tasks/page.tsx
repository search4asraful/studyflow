'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { apiRequest } from '../../lib/api';
import { Task, TaskStatus } from '@studyflow/shared';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Circle, Clock, Loader2, ArrowRight, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

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
      toast.success(
        nextStatus === 'COMPLETED' ? 'Task marked as completed!' : 'Task reopened'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 divider-subtle">
          <div>
            <h1 className="heading-page">
              My Tasks
            </h1>
            <p className="subheading-page">
              All tasks created by or assigned to you across your collaborative study rooms.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-foreground-muted">
              {tasks.filter((t) => t.status === 'COMPLETED').length} of {tasks.length} Completed
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 card-subtle p-4">
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
              <option value="ALL" className="bg-surface text-foreground">All Statuses</option>
              <option value="BACKLOG" className="bg-surface text-foreground">Backlog</option>
              <option value="TODO" className="bg-surface text-foreground">To Do</option>
              <option value="IN_PROGRESS" className="bg-surface text-foreground">In Progress</option>
              <option value="COMPLETED" className="bg-surface text-foreground">Completed</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 card-subtle border-dashed">
            <p className="text-sm text-foreground-secondary">No tasks found.</p>
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
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="mt-0.5 text-foreground-muted hover:text-accent transition-colors"
                  >
                    {task.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-sm font-medium ${
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
                      <p className="text-xs text-foreground-secondary mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-foreground-muted mt-2">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
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
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
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
    </AppShell>
  );
}
