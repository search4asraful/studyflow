'use client';

import React from 'react';
import { Task, TaskPriority, TaskStatus } from '@studyflow/shared';
import { Badge } from '../ui/Badge';
import { Clock, Trash2, ArrowRight, ArrowLeft, User, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  canDelete: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdateStatus,
  onDelete,
  canDelete,
}) => {
  const priorityConfig: Record<
    TaskPriority,
    { label: string; variant: 'default' | 'accent' | 'warning' | 'danger' }
  > = {
    LOW: { label: 'Low', variant: 'default' },
    MEDIUM: { label: 'Medium', variant: 'default' },
    HIGH: { label: 'High', variant: 'warning' },
    URGENT: { label: 'Urgent', variant: 'danger' },
  };

  const statusOrder: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'COMPLETED'];
  const currentIndex = statusOrder.indexOf(task.status);

  const prevStatus = currentIndex > 0 ? statusOrder[currentIndex - 1] : null;
  const nextStatus = currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null;

  // Ultra-compact card view specifically for COMPLETED tasks
  if (task.status === 'COMPLETED') {
    return (
      <div className="group card-subtle hover:border-emerald-500/40 hover:bg-surface-elevated/70 rounded-xl p-2.5 transition-all duration-150 shadow-2xs opacity-85 hover:opacity-100">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <h4
            className="text-xs font-medium text-foreground-muted line-through truncate flex-1 min-w-0"
            title={task.title}
          >
            {task.title}
          </h4>
          <Badge
            variant={priorityConfig[task.priority]?.variant || 'default'}
            size="sm"
            className="text-[9px] px-1.5 py-0 shrink-0"
          >
            {priorityConfig[task.priority]?.label || task.priority}
          </Badge>
          {canDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="text-foreground-muted hover:text-red-500 hover:bg-red-500/10 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Delete task"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5 text-[10px] text-foreground-muted">
          <div className="flex items-center gap-1 min-w-0">
            {task.assignee ? (
              <span className="truncate max-w-[90px]">{task.assignee.name.split(' ')[0]}</span>
            ) : (
              <span>Unassigned</span>
            )}
          </div>

          {prevStatus && (
            <button
              onClick={() => onUpdateStatus(task.id, prevStatus)}
              className="flex items-center gap-1 hover:text-accent hover:underline text-[10px] text-foreground-muted"
              title={`Reopen to ${prevStatus}`}
            >
              <ArrowLeft className="w-2.5 h-2.5" />
              <span>Reopen</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group card-subtle hover:border-accent/50 hover:bg-surface-elevated/70 rounded-xl p-2.5 sm:p-3 transition-all duration-150 shadow-2xs">
      {/* Priority & Delete header */}
      <div className="flex items-center justify-between mb-1.5">
        <Badge
          variant={priorityConfig[task.priority]?.variant || 'default'}
          size="sm"
        >
          {priorityConfig[task.priority]?.label || task.priority}
        </Badge>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="text-foreground-muted hover:text-red-500 hover:bg-red-500/10 p-0.5 rounded transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <h4 className="text-xs font-semibold text-foreground leading-snug">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-[11px] text-foreground-secondary mt-1 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer: Assignee & Due Date */}
      <div className="flex items-center justify-between mt-2 text-[10px] text-foreground-muted">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.assignee ? (
            <div className="flex items-center gap-1 min-w-0">
              {task.assignee.avatarUrl ? (
                <img
                  src={task.assignee.avatarUrl}
                  alt={task.assignee.name}
                  className="w-3.5 h-3.5 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-[8px] text-accent font-bold">
                  {task.assignee.name.charAt(0)}
                </div>
              )}
              <span className="text-[10px] truncate max-w-[85px]">{task.assignee.name}</span>
            </div>
          ) : (
            <span className="text-[10px] text-foreground-muted flex items-center gap-1">
              <User className="w-2.5 h-2.5" /> Unassigned
            </span>
          )}
        </div>

        {task.dueDate && (
          <span className="flex items-center gap-1 text-[10px] text-foreground-secondary font-mono">
            <Clock className="w-2.5 h-2.5 text-accent" />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      {/* Move Buttons (Quick Status Transition) */}
      <div className="flex items-center justify-between mt-1.5 pt-1 text-[10px] text-foreground-muted font-mono">
        {prevStatus ? (
          <button
            onClick={() => onUpdateStatus(task.id, prevStatus)}
            className="flex items-center gap-1 hover:text-accent hover:bg-surface-elevated transition-colors py-0.5 px-1.5 rounded-md text-[10px]"
            title={`Move back to ${prevStatus}`}
          >
            <ArrowLeft className="w-2.5 h-2.5" />
            <span className="capitalize">{prevStatus.replace('_', ' ').toLowerCase()}</span>
          </button>
        ) : <div />}

        {nextStatus && (
          <button
            onClick={() => onUpdateStatus(task.id, nextStatus)}
            className="flex items-center gap-1 hover:text-accent hover:bg-surface-elevated transition-colors py-0.5 px-1.5 rounded-md ml-auto text-[10px] text-accent font-semibold"
            title={`Move to ${nextStatus}`}
          >
            <span className="capitalize">{nextStatus.replace('_', ' ').toLowerCase()}</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
};
