import { Router } from 'express';

import { checkToken } from '../middlewares/auth.middleware';
import * as HistoryController from '../controllers/history.controller';

const router = Router();

router.get('/', checkToken, HistoryController.getHistory);
router.put('/', checkToken, HistoryController.putHistory);
router.delete('/:videoId', checkToken, HistoryController.removeHistory);

export default router;
