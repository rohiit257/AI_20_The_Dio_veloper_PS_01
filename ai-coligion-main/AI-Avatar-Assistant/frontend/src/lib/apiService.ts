import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export interface QueryRequest {
  query: string;
  conversationId?: string;
  model?: string;
}

export interface ContextData {
  relevantModules: string[];
  suggestedContext: string;
  detectedIntent: string;
  possibleFollowUps: string[];
}

export interface QueryResponse {
  answer: string;
  source?: string;
  context?: any;
}

export interface AvatarRequest {
  text?: string;
  voice_url?: string;
  avatar_type?: 'professional' | 'casual' | 'technical';
}

export interface AvatarResponse {
  id: string;
  status?: string;
  result_url?: string;
}

export interface AvatarStatusResponse {
  id: string;
  status: string;
  result_url?: string;
}

export interface SpeechRequest {
  text: string;
  voice?: string;
}

export interface SpeechResponse {
  audioUrl: string;
  duration?: number;
  mimeType?: string;
}

class ApiService {
  /**
   * Process a natural language query
   */
  async processQuery(data: QueryRequest): Promise<QueryResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/query`, data);
      return response.data;
    } catch (error) {
      console.error('Error processing query:', error);
      throw new Error('Failed to process query');
    }
  }

  /**
   * Alias for processQuery to maintain compatibility with new code
   */
  async sendQuery(query: string, conversationId?: string): Promise<QueryResponse> {
    return this.processQuery({ query, conversationId });
  }

  /**
   * Generate avatar video
   */
  async generateAvatar(data: AvatarRequest): Promise<AvatarResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/avatar`, data);
      return response.data;
    } catch (error) {
      console.error('Error generating avatar:', error);
      throw new Error('Failed to generate avatar');
    }
  }

  /**
   * Check avatar generation status
   */
  async getAvatarStatus(id: string): Promise<AvatarResponse> {
    try {
      const response = await axios.get(`${API_URL}/api/avatar/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting avatar status:', error);
      throw new Error('Failed to get avatar status');
    }
  }

  /**
   * Generate combined avatar (one-step process)
   */
  async generateCombinedAvatar(
    text: string,
    avatarType: 'professional' | 'casual' | 'technical' = 'professional'
  ): Promise<AvatarResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/avatar/combined`, {
        text,
        avatar_type: avatarType
      });
      return response.data;
    } catch (error) {
      console.error('Error generating combined avatar:', error);
      throw new Error('Failed to generate combined avatar');
    }
  }

  /**
   * Generate speech
   */
  async generateSpeech(data: SpeechRequest): Promise<SpeechResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/speech`, data);
      
      // Format response
      return {
        audioUrl: `data:${response.data.mimeType || 'audio/mpeg'};base64,${response.data.audioData}`,
        duration: response.data.duration,
        mimeType: response.data.mimeType
      };
    } catch (error) {
      console.error('Error generating speech:', error);
      throw new Error('Failed to generate speech');
    }
  }
}

export const apiService = new ApiService(); 