'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { RoomMember, TASK_PRIORITIES, TASK_STATUSES } from '@studyflow/shared';

const taskFormSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(120),
  description: z.string().max(1000).optional(),
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

type TaskFormData = z.infer<typeof taskFormSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  members: RoomMember[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  members,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      assigneeId: null,
      dueDate: null,
    },
  });

  const onFormSubmit = (data: TaskFormData) => {
    onSubmit({
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      assigneeId: data.assigneeId || null,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Room Task"
      description="Add a task for your study group to collaborate on."
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
            <label className="block text-xs font-medium text-foreground-secondary">Initial Status</label>
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
              {members.map((m) => (
                <option key={m.userId} value={m.userId} className="bg-surface text-foreground">
                  {m.user.name} ({m.role})
                </option>
              ))}
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
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
