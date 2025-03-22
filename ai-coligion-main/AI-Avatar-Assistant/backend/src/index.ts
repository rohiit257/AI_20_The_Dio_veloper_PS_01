// Use dynamic import for CommonJS modules
import express from 'express';
import * as http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

// Routes
import apiRoutes from './routes/api';

// Services
import { processWithGemini } from './services/geminiService';
import { processWithAdvancedGemini } from './services/openaiService';
import { getContextualData } from './services/contextService';
import { textToSpeech } from './services/elevenLabsService';
import { createTalkingAvatar } from './services/didService';
import { initializePineconeIndex } from './services/knowledgeService';

// Initialize env variables
dotenv.config();

// Setup express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://ai-avatar-assistant.vercel.app' // Add the Vercel deployment URL
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api', apiRoutes);

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new SocketServer(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://ai-avatar-assistant.vercel.app' // Add the Vercel deployment URL
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true, // Compatibility with older clients
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize Pinecone when server starts
const startupTasks = async () => {
  try {
    // Initialize Pinecone for vector search
    const pineconeSuccess = await initializePineconeIndex();
    console.log(`Pinecone initialization: ${pineconeSuccess ? 'success' : 'failed'}`);
    
    // Additional startup tasks can be added here
  } catch (error) {
    console.error('Error during startup tasks:', error);
  }
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Create a unique conversation ID for this socket connection
  const conversationId = `conv_${socket.id}`;

  socket.on('user-message', async (message) => {
    console.log('Message from client:', message);
    
    try {
      // Extract message data
      // Handle both message formats - object with 'message' property or object with 'text' property
      const text = message.message || message.text || '';
      const { 
        model = 'gemini', 
        voice = 'rachel', 
        avatar = true,
        language = 'en',
        avatarStyle = 'professional',
        conversationId: msgConversationId 
      } = message;
      
      // Use conversation ID from message or from socket
      const actualConversationId = msgConversationId || conversationId;
      
      // Send typing indicator
      socket.emit('ai-typing', { isTyping: true });
      
      // Get contextual data
      const contextData = getContextualData(text, actualConversationId);
      
      // Always use Gemini for answers - no fallback responses
      let aiResponse;
      try {
        // Try to use the more capable Gemini model
        aiResponse = await processWithAdvancedGemini(text, actualConversationId, {
          relevantInfo: contextData.suggestedContext,
          userHistory: `User has recently been looking at ${contextData.relevantModules.join(', ')}`,
          detectedIntent: contextData.detectedIntent,
        });
      } catch (aiError) {
        console.error('Error processing with Advanced Gemini:', aiError);
        
        // Try the regular Gemini as backup
        try {
          aiResponse = await processWithGemini(text, actualConversationId, {
            relevantInfo: contextData.suggestedContext,
          });
        } catch (secondError) {
          console.error('Error processing with both Gemini models:', secondError);
          throw new Error('Unable to generate a response with Gemini');
        }
      }
      
      // Create response object
      const response = {
        text: aiResponse,
        source: 'gemini_api',
        context: contextData,
        language: language
      };
      
      // Send the text response
      socket.emit('ai-response', response);
      socket.emit('ai-typing', { isTyping: false });
      
      // Generate speech if voice is requested
      if (voice) {
        try {
          const audioBuffer = await textToSpeech(aiResponse, voice);
          const audioBase64 = audioBuffer.toString('base64');
          
          socket.emit('ai-speech', {
            audioData: audioBase64,
            mimeType: 'audio/mpeg',
            voice: voice,
            language: language
          });
        } catch (speechError) {
          console.error('Error generating speech:', speechError);
          socket.emit('error', { message: 'Error generating speech' });
        }
      }
      
      // Process avatar animation if requested but disabled since we're using D-ID agent
      if (avatar) {
        try {
          // Emit processing status
          socket.emit('avatar-processing', { isProcessing: true });
          
          // Send D-ID API not configured message
          socket.emit('ai-avatar', { 
            id: 'using-did-agent',
            status: 'using-external-agent',
            message: 'Using external D-ID agent instead of built-in avatar'
          });
          
          socket.emit('avatar-processing', { isProcessing: false });
        } catch (avatarError) {
          console.error('Error processing avatar:', avatarError);
          socket.emit('error', { message: 'Error with avatar processing' });
          socket.emit('avatar-processing', { isProcessing: false });
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Error processing your request. Please try again.' });
      socket.emit('ai-typing', { isTyping: false });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startupTasks(); // Run startup tasks after server is listening
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
}); 