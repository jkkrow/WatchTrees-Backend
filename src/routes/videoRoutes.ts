import { Router } from 'express';

import * as videoController from '../controllers/videoController';

const router = Router();

router.get('/', videoController.getVideo);

export default router;
