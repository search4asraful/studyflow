import { Router } from 'express';
import { RoomController } from '../controllers/roomController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createRoomSchema,
  updateRoomSchema,
  joinRoomSchema,
} from '../shared';

export const roomRouter = Router();

roomRouter.use(authenticate);

roomRouter.get('/', RoomController.getRooms);
roomRouter.post('/', validateBody(createRoomSchema), RoomController.createRoom);
roomRouter.post('/join', validateBody(joinRoomSchema), RoomController.joinRoom);
roomRouter.get('/:id', RoomController.getRoomDetails);
roomRouter.patch('/:id', validateBody(updateRoomSchema), RoomController.updateRoom);
roomRouter.delete('/:id', RoomController.deleteRoom);
roomRouter.post('/:id/leave', RoomController.leaveRoom);
roomRouter.patch('/:id/members/:userId/role', RoomController.updateMemberRole);

// REST Fallback for Timer Controls & State
roomRouter.get('/:id/timer', RoomController.getTimerState);
roomRouter.post('/:id/timer/start', RoomController.startTimer);
roomRouter.post('/:id/timer/pause', RoomController.pauseTimer);
roomRouter.post('/:id/timer/resume', RoomController.resumeTimer);
roomRouter.post('/:id/timer/skip', RoomController.skipPhase);
