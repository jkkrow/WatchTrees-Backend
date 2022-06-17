import { Router } from 'express';

import { checkAccessToken } from '../middlewares/auth.middleware';
import * as HistoryController from '../controllers/history.controller';

const router = Router();

router.get('/', checkAccessToken, HistoryController.getHistory);
router.put('/', checkAccessToken, HistoryController.putHistory);
router.delete('/:videoId', checkAccessToken, HistoryController.removeHistory);

export default router;
