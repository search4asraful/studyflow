import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

analyticsRouter.get('/summary', AnalyticsController.getSummary);
