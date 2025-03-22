import { Router, Request, Response, NextFunction } from 'express';
import { processQuery } from '../controllers/queryController';
import { generateAvatar, getAvatarStatus, generateCombinedAvatar } from '../controllers/avatarController';
import { generateSpeech, getAvailableVoices, getVoiceDetails } from '../controllers/speechController';

const router = Router();

// Wrapper to handle async route handlers
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Query processing
router.post('/query', asyncHandler(processQuery));

// Avatar generation
router.post('/avatar', asyncHandler(generateAvatar));
router.get('/avatar/:id', asyncHandler(getAvatarStatus));
router.post('/avatar/combined', asyncHandler(generateCombinedAvatar));

// Voice management
router.post('/speech', asyncHandler(generateSpeech));
router.get('/voices', asyncHandler(getAvailableVoices));
router.get('/voices/:voiceId', asyncHandler(getVoiceDetails));

export default router; 