import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Interface for avatar presets
interface AvatarPreset {
  source_url: string; 
  driver_url?: string;
  name: string;
  type: string;
}

// Interface for active talk tracking
interface ActiveTalk {
  id: string;
  startedAt: Date;
  status: 'processing' | 'done' | 'error';
  resultUrl?: string;
  error?: string;
}

// Define avatar presets with local paths (relative to the frontend public directory)
const AVATAR_PRESETS: { [key: string]: AvatarPreset } = {
  professional: {
    source_url: '/assets/images/professional.png',
    driver_url: '/assets/videos/driver.mp4',
    name: 'Professional',
    type: 'image',
  },
  friendly: {
    source_url: '/assets/images/friendly.png',
    driver_url: '/assets/videos/driver.mp4',
    name: 'Friendly',
    type: 'image',
  },
  casual: {
    source_url: '/assets/videos/casual.mp4',
    name: 'Casual',
    type: 'video',
  },
};

// Default sample avatar video URLs (ensure these files exist in your public directory)
const SAMPLE_AVATAR_URLS = [
  '/assets/videos/default-avatar.mp4',
  '/assets/videos/sample-avatar-1.mp4',
  '/assets/videos/sample-avatar-2.mp4',
];

// Map to track active talks
const activeTalks = new Map<string, ActiveTalk>();

// Check if D-ID API key is available (for logging purposes only)
const hasDidApiKey = !!process.env.DID_API_KEY;
console.log(`D-ID API ${hasDidApiKey ? 'is' : 'is not'} configured with an API key`);

/**
 * Creates a talking avatar based on text or voice URL and avatar type
 * In this implementation, this is a mock that returns a sample video
 */
export const createTalkingAvatar = async (
  text: string | null,
  voiceUrl: string | null,
  avatarType: string = 'professional'
): Promise<{ id: string }> => {
  try {
    if (!text && !voiceUrl) {
      console.error('Did not receive either text or voice_url for avatar creation');
      throw new Error('Either text or voice_url is required');
    }

    console.log(`[MOCK] Creating talking avatar with type: ${avatarType}`);
    
    // Generate a unique ID for this talk
    const talkId = uuidv4();
    
    // Store active talk with processing status
    activeTalks.set(talkId, {
      id: talkId,
      startedAt: new Date(),
      status: 'processing'
    });
    
    // Simulate API processing time (1-3 seconds)
    setTimeout(() => {
      // Pick a random sample avatar URL for the mock response
      const randomIndex = Math.floor(Math.random() * SAMPLE_AVATAR_URLS.length);
      const resultUrl = SAMPLE_AVATAR_URLS[randomIndex];
      
      // Update talk status to done with the result URL
      activeTalks.set(talkId, {
        ...activeTalks.get(talkId)!,
        status: 'done',
        resultUrl
      });
      
      console.log(`[MOCK] Avatar generation completed for ID: ${talkId}`);
    }, 1000 + Math.random() * 2000);
    
    return { id: talkId };
  } catch (error) {
    console.error(`Error creating talking avatar: ${error}`);
    throw error;
  }
};

/**
 * Gets the status of a talking avatar by its ID
 */
export const getTalkStatus = async (id: string): Promise<{
  status: string;
  result_url?: string;
  error?: string;
}> => {
  // Check if we have this talk in our active talks map
  const talk = activeTalks.get(id);
  
  if (!talk) {
    return { 
      status: 'error',
      error: 'Talk not found' 
    };
  }
  
  return {
    status: talk.status,
    result_url: talk.resultUrl,
    error: talk.error
  };
};

/**
 * Creates a combined animation with speech and avatar
 * This is a mock implementation that returns a sample video after a delay
 */
export const createCombinedAnimation = async (
  text: string,
  avatarType: string = 'professional'
): Promise<{ id: string }> => {
  console.log(`[MOCK] Creating combined animation for text: "${text.substring(0, 30)}..." with avatar type: ${avatarType}`);
  
  // Create a talking avatar with the given text
  return createTalkingAvatar(text, null, avatarType);
}; 