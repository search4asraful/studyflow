import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createTaskSchema, updateTaskSchema } from '../shared';

export const taskRouter = Router();

taskRouter.use(authenticate);

taskRouter.get('/my', TaskController.getMyTasks);
taskRouter.post('/', validateBody(createTaskSchema), TaskController.createTask);
taskRouter.patch('/:id', validateBody(updateTaskSchema), TaskController.updateTask);
taskRouter.delete('/:id', TaskController.deleteTask);
