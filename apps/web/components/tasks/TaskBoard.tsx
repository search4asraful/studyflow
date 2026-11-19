'use client';

import React, { useState, useMemo } from 'react';
import { Task, TaskStatus } from '@studyflow/shared';
import { TaskCard } from './TaskCard';
import { Button } from '../ui/Button';
import { Plus, Search, Filter } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenCreateModal: () => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'BACKLOG', title: 'Backlog', color: 'bg-zinc-500' },
  { id: 'TODO', title: 'To Do', color: 'bg-amber-500 dark:bg-amber-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-accent' },
  { id: 'COMPLETED', title: 'Completed', color: 'bg-emerald-600 dark:bg-emerald-400' },
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

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Board Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 card-subtle p-3.5">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search room tasks..."
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
              <option value="ALL" className="bg-surface text-foreground">All Priorities</option>
              <option value="LOW" className="bg-surface text-foreground">Low</option>
              <option value="MEDIUM" className="bg-surface text-foreground">Medium</option>
              <option value="HIGH" className="bg-surface text-foreground">High</option>
              <option value="URGENT" className="bg-surface text-foreground">Urgent</option>
            </select>
          </div>
        </div>

        <Button
          onClick={onOpenCreateModal}
          size="sm"
          className="whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* 4-Column Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col bg-surface border border-border rounded-2xl p-3.5 min-h-[400px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 divider-subtle">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.color}`} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {col.title}
                  </h3>
                </div>
                <span className="text-xs text-foreground-muted font-mono bg-surface-elevated px-2 py-0.5 rounded-full border border-border">
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
                      onUpdateStatus={(taskId, newStatus) =>
                        onUpdateTask(taskId, { status: newStatus })
                      }
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
