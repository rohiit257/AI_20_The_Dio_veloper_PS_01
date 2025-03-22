import { Request, Response } from 'express';
import { createTalkingAvatar, getTalkStatus, createCombinedAnimation } from '../services/didService';

/**
 * Generate avatar using D-ID API
 */
export const generateAvatar = async (req: Request, res: Response) => {
  try {
    const { text, voice_url, avatar_type } = req.body;
    
    if (!text && !voice_url) {
      return res.status(400).json({ error: 'Either text or voice_url is required' });
    }
    
    // Start the avatar generation process
    const result = await createTalkingAvatar(
      text || null,
      voice_url || null,
      avatar_type || 'professional'
    );
    
    return res.status(200).json({
      id: result.id,
      status: 'processing'
    });
    
  } catch (error) {
    console.error('Error generating avatar:', error);
    return res.status(500).json({ 
      error: 'Failed to generate avatar',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get avatar generation status
 */
export const getAvatarStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Avatar ID is required' });
    }
    
    const status = await getTalkStatus(id);
    
    return res.status(200).json(status);
    
  } catch (error) {
    console.error('Error getting avatar status:', error);
    return res.status(500).json({ 
      error: 'Failed to get avatar status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Generate combined avatar and speech in one request
 */
export const generateCombinedAvatar = async (req: Request, res: Response) => {
  try {
    const { text, avatar_type } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Immediately return a processing status
    const result = await createCombinedAnimation(text, avatar_type);
    
    res.status(202).json({ 
      id: result.id,
      status: 'processing',
      message: 'Avatar generation has begun. Check back with the provided ID.'
    });
    
  } catch (error) {
    console.error('Error generating combined avatar:', error);
    return res.status(500).json({ 
      error: 'Failed to generate combined avatar',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 