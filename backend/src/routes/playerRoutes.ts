import { Router } from 'express';
import { getPlayerData } from '../controllers/playerController.js';
import { importVideo, getVideos, removeVideo } from '../controllers/videoController.js';

const router = Router();

// Player data
router.get('/player/:videoId', getPlayerData);

// Video management
router.post('/videos', importVideo);
router.get('/videos', getVideos);
router.delete('/videos/:videoId', removeVideo);

export default router;
