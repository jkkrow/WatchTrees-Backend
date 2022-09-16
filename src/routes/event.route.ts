import { Router } from 'express';

import * as EventController from '../controllers/event.controller';
import { verifyEventHeaders } from '../middlewares/event.middleware';

const router = Router();

router.post(
  '/users/create',
  verifyEventHeaders,
  EventController.userCreateEventHandler
);

export default router;
