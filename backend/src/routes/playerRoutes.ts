import { Router } from 'express';
import { getPlayerData, updateSentenceProgress, updateVideoProgress } from '../controllers/playerController.js';
import { importVideo, getVideos, removeVideo } from '../controllers/videoController.js';
import { getPatterns, getPatternDetails, rescanPatterns } from '../controllers/patternController.js';

const router = Router();

// Player data
router.get('/player/:videoId', getPlayerData);
router.put('/player/:videoId/sentences/:sentenceId', updateSentenceProgress);
router.put('/player/:videoId/progress', updateVideoProgress);

// Video management
router.post('/videos', importVideo);
router.get('/videos', getVideos);
router.delete('/videos/:videoId', removeVideo);

// Pattern management
router.get('/patterns', getPatterns);
router.get('/patterns/:patternId', getPatternDetails);
router.post('/patterns/rescan', rescanPatterns);



export default router;
