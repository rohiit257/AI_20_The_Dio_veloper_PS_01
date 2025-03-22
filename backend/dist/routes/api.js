import { Router } from 'express';
import { processQuery } from '../controllers/queryController.js';
import { generateAvatar, getAvatarStatus, generateCombinedAvatar } from '../controllers/avatarController.js';
import { generateSpeech, getAvailableVoices, getVoiceDetails } from '../controllers/speechController.js';
const router = Router();
// Wrapper to handle async route handlers
const asyncHandler = (fn) => (req, res, next) => {
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
