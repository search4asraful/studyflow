import { Request, Response, NextFunction } from 'express';
import { RoomService } from '../services/roomService';
import { TimerService } from '../services/timerService';

export class RoomController {
  static async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await RoomService.createRoom(req.user!.id, req.body);
      res.status(201).json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  static async getRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const rooms = await RoomService.getRoomsForUser(req.user!.id);
      res.status(200).json({ success: true, data: rooms });
    } catch (error) {
      next(error);
    }
  }

  static async getRoomDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const details = await RoomService.getRoomDetails(id, req.user!.id);
      res.status(200).json({ success: true, data: details });
    } catch (error) {
      next(error);
    }
  }

  static async joinRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { inviteCode } = req.body;
      const room = await RoomService.joinRoomByCode(req.user!.id, inviteCode);
      res.status(200).json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  static async leaveRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await RoomService.leaveRoom(id, req.user!.id);
      res.status(200).json({ success: true, message: 'Left room successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async updateRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const room = await RoomService.updateRoom(id, req.user!.id, req.body);
      res.status(200).json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await RoomService.deleteRoom(id, req.user!.id);
      res.status(200).json({ success: true, message: 'Room deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async getTimerState(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const timerState = await TimerService.getAuthoritativeState(id);
      res.status(200).json({ success: true, data: timerState });
    } catch (error) {
      next(error);
    }
  }

  static async startTimer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const timerState = await TimerService.startTimer(id, req.user!.id);
      res.status(200).json({ success: true, data: timerState });
    } catch (error) {
      next(error);
    }
  }

  static async pauseTimer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const timerState = await TimerService.pauseTimer(id, req.user!.id);
      res.status(200).json({ success: true, data: timerState });
    } catch (error) {
      next(error);
    }
  }

  static async resumeTimer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const timerState = await TimerService.resumeTimer(id, req.user!.id);
      res.status(200).json({ success: true, data: timerState });
    } catch (error) {
      next(error);
    }
  }

  static async skipPhase(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { targetPhase } = req.body;
      const timerState = await TimerService.skipPhase(id, req.user!.id, targetPhase);
      res.status(200).json({ success: true, data: timerState });
    } catch (error) {
      next(error);
    }
  }

  static async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.params.userId as string;
      const { role } = req.body;
      const result = await RoomService.updateMemberRole(id, userId, role, req.user!.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
