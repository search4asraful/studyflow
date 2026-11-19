import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/taskService';

export class TaskController {
  static async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.createTask(req.user!.id, req.body);
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const task = await TaskService.updateTask(id, req.user!.id, req.body);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await TaskService.deleteTask(id, req.user!.id);
      res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getMyTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await TaskService.getUserTasks(req.user!.id);
      res.status(200).json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  }
}
