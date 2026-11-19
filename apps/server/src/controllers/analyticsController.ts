import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService';

export class AnalyticsController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await AnalyticsService.getUserAnalytics(req.user!.id);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}
