'use client';

import React from 'react';
import { Task, TaskPriority, TaskStatus } from '@studyflow/shared';
import { Badge } from '../ui/Badge';
import { Clock, Trash2, ArrowRight, ArrowLeft, User } from 'lucide-react';
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

  return (
    <div className="group card-subtle hover:border-accent/40 rounded-xl p-4 transition-all duration-150 shadow-sm">
      {/* Priority & Delete header */}
      <div className="flex items-center justify-between mb-2">
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
              className="text-foreground-muted hover:text-red-600 dark:hover:text-red-400 p-1 rounded transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <h4
        className={`text-sm font-medium text-foreground leading-snug ${
          task.status === 'COMPLETED' ? 'line-through text-foreground-muted' : ''
        }`}
      >
        {task.title}
      </h4>

      {task.description && (
        <p className="text-xs text-foreground-secondary mt-1.5 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer: Assignee & Due Date */}
      <div className="flex items-center justify-between mt-3 pt-2.5 divider-subtle text-xs text-foreground-muted">
        <div className="flex items-center gap-1.5">
          {task.assignee ? (
            <div className="flex items-center gap-1.5 text-foreground-secondary">
              {task.assignee.avatarUrl ? (
                <img
                  src={task.assignee.avatarUrl}
                  alt={task.assignee.name}
                  className="w-4 h-4 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[9px] text-accent font-bold">
                  {task.assignee.name.charAt(0)}
                </div>
              )}
              <span className="text-[11px] truncate max-w-[90px]">{task.assignee.name}</span>
            </div>
          ) : (
            <span className="text-[11px] text-foreground-muted flex items-center gap-1">
              <User className="w-3 h-3" /> Unassigned
            </span>
          )}
        </div>

        {task.dueDate && (
          <span className="flex items-center gap-1 text-[11px] text-foreground-secondary">
            <Clock className="w-3 h-3" />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      {/* Move Buttons (Quick Status Transition) */}
      <div className="flex items-center justify-between mt-2 pt-2 divider-subtle text-xs text-foreground-muted">
        {prevStatus ? (
          <button
            onClick={() => onUpdateStatus(task.id, prevStatus)}
            className="flex items-center gap-1 hover:text-accent transition-colors py-0.5 px-1.5 rounded"
            title={`Move back to ${prevStatus}`}
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="text-[10px] capitalize">{prevStatus.replace('_', ' ').toLowerCase()}</span>
          </button>
        ) : <div />}

        {nextStatus && (
          <button
            onClick={() => onUpdateStatus(task.id, nextStatus)}
            className="flex items-center gap-1 hover:text-accent transition-colors py-0.5 px-1.5 rounded ml-auto"
            title={`Move to ${nextStatus}`}
          >
            <span className="text-[10px] capitalize">{nextStatus.replace('_', ' ').toLowerCase()}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
