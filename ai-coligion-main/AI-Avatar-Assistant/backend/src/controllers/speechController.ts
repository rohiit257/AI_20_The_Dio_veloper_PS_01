import { Request, Response } from 'express';
import { textToSpeech, listVoices, getVoice } from '../services/elevenLabsService';

/**
 * Generate speech from text using ElevenLabs
 */
export const generateSpeech = async (req: Request, res: Response) => {
  try {
    const { text, voiceId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Generate speech audio
    const audioBuffer = await textToSpeech(text, voiceId);
    
    // Convert to base64 for transport
    const audioBase64 = audioBuffer.toString('base64');
    
    // Calculate approximate duration (1 second of audio per ~15 characters of text)
    const estimatedDuration = Math.max(1, Math.ceil(text.length / 15));
    
    return res.status(200).json({
      audioData: audioBase64,
      duration: estimatedDuration,
      mimeType: 'audio/mpeg'
    });
    
  } catch (error) {
    console.error('Error generating speech:', error);
    return res.status(500).json({ 
      error: 'Failed to generate speech',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * List available voices
 */
export const getAvailableVoices = async (_req: Request, res: Response) => {
  try {
    const voices = await listVoices();
    return res.status(200).json({ voices });
  } catch (error) {
    console.error('Error getting voices:', error);
    return res.status(500).json({ 
      error: 'Failed to get voices',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get voice details
 */
export const getVoiceDetails = async (req: Request, res: Response) => {
  try {
    const { voiceId } = req.params;
    
    if (!voiceId) {
      return res.status(400).json({ error: 'Voice ID is required' });
    }
    
    const voice = await getVoice(voiceId);
    return res.status(200).json({ voice });
  } catch (error) {
    console.error('Error getting voice details:', error);
    return res.status(500).json({ 
      error: 'Failed to get voice details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 