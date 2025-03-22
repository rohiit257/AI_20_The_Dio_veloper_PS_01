import axios from 'axios';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Define the API key and base URL from environment variables
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Base64 encoded minimal valid MP3 file (silent audio with correct headers)
// This helps avoid audio player errors when no real audio is available
const SILENT_MP3_BASE64 = 'SUQzBAAAAAABE1RYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsQbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

// Function to convert base64 to buffer
const base64ToBuffer = (base64: string): Buffer => {
  return Buffer.from(base64, 'base64');
};

// Define available ElevenLabs voices
export const ELEVENLABS_VOICES = {
  'Rachel': 'r0SSKjgKrIJ5g3nFSCxg', // Female, gentle calm
  'Domi': 'AT4wGCH31jBfZoLPCSpA', // Female, enthusiastic 
  'Bella': 'EXAVITQu4vr4xnSDxMaL', // Female, soft breathy
  'Antoni': 'ErXwobaYiN019PkySvjV', // Male, deep warm
  'Thomas': 'GBv7mTt0atIp3Br8iCZE', // Male, thoughtful
  'Josh': 'TxGEqnHWrfWFTfGW9XjX', // Male, friendly  
  'Adam': 'pNInz6obpgDQGcFmaJgB', // Male, balanced
  'Sam': 'yoZ06aMxZJJ28mfd3POQ' // Male, authoritative
};

/**
 * Convert text to speech using ElevenLabs API
 * @param text The text to convert to speech
 * @param voiceId The voice ID to use
 * @returns Buffer containing MP3 audio data
 */
export const textToSpeech = async (
  text: string, 
  voiceId: string = ELEVENLABS_VOICES.Adam
): Promise<Buffer> => {
  try {
    // Check if API key is available
    if (!ELEVENLABS_API_KEY) {
      console.warn('ELEVENLABS_API_KEY not set, returning silent audio');
      return base64ToBuffer(SILENT_MP3_BASE64);
    }

    // Call ElevenLabs API
    const response = await axios({
      method: 'POST',
      url: `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      data: {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error in ElevenLabs TTS service:', error);
    // Return silent audio instead of empty buffer to prevent playback errors
    return base64ToBuffer(SILENT_MP3_BASE64);
  }
};

/**
 * List available voices from ElevenLabs
 */
export const listVoices = async () => {
  try {
    return [];
  } catch (error) {
    console.error('Error getting voices from ElevenLabs:', error);
    return [];
  }
};

/**
 * Get a specific voice from ElevenLabs
 */
export const getVoice = async (voiceId: string) => {
  try {
    return {};
  } catch (error) {
    console.error(`Error getting voice ${voiceId} from ElevenLabs:`, error);
    return {};
  }
}; 