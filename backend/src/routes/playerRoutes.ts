import { Router } from 'express';
import { getPlayerData } from '../controllers/playerController.js';

const router = Router();

router.get('/player/:videoId', getPlayerData);

export default router;
