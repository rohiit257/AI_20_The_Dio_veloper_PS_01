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
app.use(cors());
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
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
      const { model = 'gemini', voice, avatar, conversationId: msgConversationId } = message;
      
      // Use conversation ID from message or from socket
      const actualConversationId = msgConversationId || conversationId;
      
      // Send typing indicator
      socket.emit('ai-typing', { isTyping: true });
      
      // Get contextual data
      const contextData = getContextualData(text, actualConversationId);
      
      // Process with selected AI model based on complexity
      let aiResponse;
      try {
        const isComplexQuery = 
          text.length > 50 || 
          text.includes('explain') || 
          text.includes('how') || 
          contextData.detectedIntent === 'how_to' ||
          contextData.detectedIntent === 'troubleshooting';
          
        if (isComplexQuery) {
          // Use advanced Gemini for complex queries
          aiResponse = await processWithAdvancedGemini(text, actualConversationId, {
            relevantInfo: contextData.suggestedContext,
            userHistory: `User has recently been looking at ${contextData.relevantModules.join(', ')}`,
            detectedIntent: contextData.detectedIntent
          });
        } else {
          // Default to regular Gemini for simple queries
          aiResponse = await processWithGemini(text, actualConversationId, {
            relevantInfo: contextData.suggestedContext
          });
        }
      } catch (aiError) {
        console.error('Error processing with AI:', aiError);
        aiResponse = "I'm having trouble connecting to my knowledge system right now. Please try again in a moment.";
      }
      
      // Create response object
      const response = {
        text: aiResponse,
        source: 'gemini_api',
        context: contextData
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
            mimeType: 'audio/mpeg'
          });
        } catch (speechError) {
          console.error('Error generating speech:', speechError);
          socket.emit('error', { message: 'Error generating speech' });
        }
      }
      
      // Process avatar animation if requested
      if (avatar) {
        try {
          // Emit processing status
          socket.emit('avatar-processing', { isProcessing: true });
          socket.emit('ai-avatar', { id: 'processing' });
          
          // Call the DID API service
          const avatarResult = await createTalkingAvatar(
            aiResponse,
            null,
            'professional'
          );
          
          // Send avatar ID for client-side polling
          socket.emit('ai-avatar', { 
            id: avatarResult.id,
            status: 'processing'
          });
          
          socket.emit('avatar-processing', { isProcessing: false });
        } catch (avatarError) {
          console.error('Error processing avatar:', avatarError);
          socket.emit('error', { message: 'Error generating avatar animation' });
          socket.emit('avatar-processing', { isProcessing: false });
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Error processing your request' });
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