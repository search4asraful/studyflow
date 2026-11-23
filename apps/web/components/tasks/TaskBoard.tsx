'use client';

import { Task, TaskStatus } from '@studyflow/shared';
import { CheckCircle2, Filter, Plus, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { playTaskCompletionSound } from '../../lib/audio';
import { triggerConfetti } from '../../lib/confetti';
import { Button } from '../ui/Button';
import { TaskCard } from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenCreateModal: () => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; badgeColor: string }[] = [
  { id: 'BACKLOG', title: 'Backlog', color: 'bg-zinc-400', badgeColor: 'bg-zinc-500/15 text-zinc-400' },
  { id: 'TODO', title: 'To Do', color: 'bg-amber-400', badgeColor: 'bg-amber-500/15 text-amber-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-accent', badgeColor: 'bg-accent/15 text-accent' },
  { id: 'COMPLETED', title: 'Completed', color: 'bg-emerald-400', badgeColor: 'bg-emerald-500/15 text-emerald-400' },
];

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onOpenCreateModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleStatusTransition = (taskId: string, newStatus: TaskStatus) => {
    onUpdateTask(taskId, { status: newStatus });
    if (newStatus === 'COMPLETED') {
      triggerConfetti({ particleCount: 60 });
      playTaskCompletionSound();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Board Controls & Progress Bar */}
      <div className="card-subtle p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter room tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-base pl-9 py-1.5 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-foreground-muted" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input-base w-auto px-2.5 py-1.5 text-xs bg-surface text-foreground"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <Button
            onClick={onOpenCreateModal}
            size="sm"
            variant="primary"
            className="whitespace-nowrap gap-1.5 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Room Task
          </Button>
        </div>

        {/* Task Board Completion Progress Bar */}
        {tasks.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-foreground-muted">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Overall Task Progress
              </span>
              <span>{completedCount} of {tasks.length} resolved ({progressPercent}%)</span>
            </div>
            <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-accent to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4-Column Board Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col bg-surface/90 backdrop-blur-md border border-border rounded-2xl p-3.5 min-h-105 shadow-xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.color}`} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {col.title}
                  </h3>
                </div>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border border-border font-semibold ${col.badgeColor}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-380px)] pr-1">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 border border-dashed border-border-subtle rounded-xl text-center p-3">
                    <p className="text-xs text-foreground-muted">No tasks in {col.title.toLowerCase()}</p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdateStatus={handleStatusTransition}
                      onDelete={onDeleteTask}
                      canDelete={true}
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
