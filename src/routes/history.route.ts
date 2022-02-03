import { Router } from 'express';

import { checkToken } from '../middlewares/auth.middleware';
import * as historyController from '../controllers/history.controller';

const router = Router();

router.get('/', checkToken, historyController.getHistory);
router.put('/', checkToken, historyController.putHistory);
router.delete('/:videoId', checkToken, historyController.removeHistory);

export default router;
