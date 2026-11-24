'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { RoomMember, Task, TASK_PRIORITIES, TASK_STATUSES } from '@studyflow/shared';
import { format } from 'date-fns';

const editTaskFormSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(120),
  description: z.string().max(1000).optional().nullable(),
  priority: z.enum([
    TASK_PRIORITIES.LOW,
    TASK_PRIORITIES.MEDIUM,
    TASK_PRIORITIES.HIGH,
    TASK_PRIORITIES.URGENT,
  ]),
  status: z.enum([
    TASK_STATUSES.BACKLOG,
    TASK_STATUSES.TODO,
    TASK_STATUSES.IN_PROGRESS,
    TASK_STATUSES.COMPLETED,
  ]),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

type EditTaskFormData = z.infer<typeof editTaskFormSchema>;

export interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskId: string, updates: Partial<Task>) => void;
  task: Task | null;
  members?: RoomMember[];
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  task,
  members = [],
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      assigneeId: '',
      dueDate: '',
    },
  });

  useEffect(() => {
    if (task && isOpen) {
      let formattedDate = '';
      if (task.dueDate) {
        try {
          formattedDate = format(new Date(task.dueDate), 'yyyy-MM-dd');
        } catch {
          formattedDate = '';
        }
      }

      reset({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'MEDIUM',
        status: task.status || 'TODO',
        assigneeId: task.assigneeId || '',
        dueDate: formattedDate,
      });
    }
  }, [task, isOpen, reset]);

  const onFormSubmit = (data: EditTaskFormData) => {
    if (!task) return;

    onSubmit(task.id, {
      title: data.title,
      description: data.description ? data.description : null,
      priority: data.priority,
      status: data.status,
      assigneeId: data.assigneeId ? data.assigneeId : null,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    });
    onClose();
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Task"
      description="Update task details, assignment, and delivery status."
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 mt-2">
        <Input
          label="Task Title *"
          placeholder="e.g., Review distributed systems problem set"
          {...register('title')}
          error={errors.title?.message}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-foreground-secondary">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Add relevant notes, links, or objectives..."
            className="input-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground-secondary">Priority</label>
            <select
              {...register('priority')}
              className="input-base bg-surface text-foreground"
            >
              <option value="LOW" className="bg-surface text-foreground">Low</option>
              <option value="MEDIUM" className="bg-surface text-foreground">Medium</option>
              <option value="HIGH" className="bg-surface text-foreground">High</option>
              <option value="URGENT" className="bg-surface text-foreground">Urgent</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground-secondary">Status</label>
            <select
              {...register('status')}
              className="input-base bg-surface text-foreground"
            >
              <option value="BACKLOG" className="bg-surface text-foreground">Backlog</option>
              <option value="TODO" className="bg-surface text-foreground">To Do</option>
              <option value="IN_PROGRESS" className="bg-surface text-foreground">In Progress</option>
              <option value="COMPLETED" className="bg-surface text-foreground">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground-secondary">Assignee</label>
            <select
              {...register('assigneeId')}
              className="input-base bg-surface text-foreground"
            >
              <option value="" className="bg-surface text-foreground">Unassigned</option>
              {members.length > 0 ? (
                members.map((m) => (
                  <option key={m.userId} value={m.userId} className="bg-surface text-foreground">
                    {m.user.name} ({m.role})
                  </option>
                ))
              ) : task.assignee ? (
                <option value={task.assignee.id} className="bg-surface text-foreground">
                  {task.assignee.name} (Current)
                </option>
              ) : null}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground-secondary">Due Date</label>
            <input
              type="date"
              {...register('dueDate')}
              className="input-base py-1.5"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
