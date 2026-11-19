import { Router, Request, Response } from 'express';
import { authRouter } from './authRoutes';
import { roomRouter } from './roomRoutes';
import { taskRouter } from './taskRoutes';
import { analyticsRouter } from './analyticsRoutes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/rooms', roomRouter);
apiRouter.use('/tasks', taskRouter);
apiRouter.use('/analytics', analyticsRouter);

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
