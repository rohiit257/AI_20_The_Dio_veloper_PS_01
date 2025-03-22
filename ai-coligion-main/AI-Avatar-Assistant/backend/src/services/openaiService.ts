import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCXA0NIKhioAXSxHtLThqEY1xDrJhjWCO0';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Model configuration
const MODEL_NAME = 'gemini-2.0-flash';

// Storage for conversation history
const advancedConversations = new Map<string, any[]>();

interface ContextData {
  relevantInfo?: string;
  userHistory?: string;
  userPreferences?: string;
  detectedIntent?: string;
}

/**
 * Enhanced Gemini service for advanced language processing (OpenAI replacement)
 */
export const processWithAdvancedGemini = async (
  query: string,
  conversationId?: string,
  contextData?: ContextData
): Promise<string> => {
  try {
    console.log(`Processing advanced query with model: ${MODEL_NAME}`);
    
    // Get the model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Get or create conversation history
    if (conversationId && !advancedConversations.has(conversationId)) {
      advancedConversations.set(conversationId, []);
    }
    
    // Create enhanced system prompt with ERP context
    let enhancedPrompt = `You are an AI assistant specialized in ERP systems.
You provide accurate, helpful information about ERP functionality, troubleshooting, and best practices.
Be professional, concise, and accurate in your responses.
Speak naturally and conversationally, as this will be spoken by an avatar assistant.`;

    // Add context if available
    if (contextData?.relevantInfo) {
      enhancedPrompt += `\n\nHere is some relevant information that might help: ${contextData.relevantInfo}`;
    }
    if (contextData?.userHistory) {
      enhancedPrompt += `\n\nUser's recent activity: ${contextData.userHistory}`;
    }
    if (contextData?.detectedIntent) {
      enhancedPrompt += `\n\nThe user's intent appears to be: ${contextData.detectedIntent}`;
    }
    
    enhancedPrompt += `\n\nUser query: ${query}`;
    
    // Use direct generation approach
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response.text();
    
    // Store conversation if we have an ID
    if (conversationId) {
      const history = advancedConversations.get(conversationId) || [];
      history.push({ query, response });
      advancedConversations.set(conversationId, history);
    }
    
    return response;
  } catch (error) {
    console.error('Error calling Advanced Gemini API:', error);
    
    // For development, return a fallback response
    return "I apologize, but I'm having trouble accessing my advanced reasoning capabilities right now. As a helpful assistant, I can tell you that ERP systems help businesses integrate and manage their core processes. Could you please try asking your question in a different way?";
  }
}; 