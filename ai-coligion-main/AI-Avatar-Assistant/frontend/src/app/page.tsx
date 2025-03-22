'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import AvatarRenderer from '../components/AvatarRenderer';
import ChatMessage from '../components/ChatMessage';
import ThemeToggle from '../components/ThemeToggle';

// Define types for messages
interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [debug, setDebug] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Initialize socket
  useEffect(() => {
    const newSocket = io('http://localhost:5001', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    
    // Log connection attempt
    console.log('Attempting to connect to backend at http://localhost:5001');
    addDebugMessage('Connecting to backend at port 5001...');

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      addDebugMessage('Socket connected successfully');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      addDebugMessage('Socket disconnected');
    });
    
    newSocket.on('connect_error', (err) => {
      setIsConnected(false);
      setError(`Connection error: ${err.message}`);
      addDebugMessage(`Socket connection error: ${err.message}`);
      console.error('Socket connection error:', err);
    });

    // Handle text responses from server
    newSocket.on('ai-response', (data) => {
      console.log('Received response:', data);
      addDebugMessage(`Received response: ${JSON.stringify(data)}`);
      
      // Extract text from various response formats
      let responseText = '';
      if (typeof data === 'string') {
        responseText = data;
      } else if (data && typeof data === 'object') {
        responseText = data.text || data.answer || data.response || data.content || '';
      }
      
      if (responseText) {
        setMessages(prev => [...prev, { 
          text: responseText, 
          isUser: false, 
          timestamp: new Date() 
        }]);
      }
      
      setIsLoading(false);
    });
    
    // Handle speech responses
    newSocket.on('ai-speech', (data) => {
      addDebugMessage(`Received speech data`);
      
      if (data && data.audioData) {
        // Handle audio data if needed
        addDebugMessage(`Speech data received (${data.audioData.length} bytes)`);
      }
    });
    
    // Handle typing indicators
    newSocket.on('ai-typing', (data) => {
      // Could show typing animation based on this
      addDebugMessage(`AI typing status: ${data?.isTyping}`);
    });
    
    // Separate handler for avatar-specific events
    newSocket.on('ai-avatar', (data) => {
      console.log('Received avatar:', data);
      addDebugMessage(`Received avatar event: ${JSON.stringify(data)}`);
      
      // If we get an ID only, the avatar is still processing
      if (data.id && !data.url && !data.result_url) {
        addDebugMessage(`Avatar processing with ID: ${data.id}`);
        return;
      }
      
      let url = '';
      // Check all possible formats for avatar URL
      if (typeof data === 'string') {
        url = data;
      } else if (data && typeof data === 'object') {
        url = data.url || data.result_url || data.avatar_url || data.video_url || '';
      }
      
      if (url) {
        addDebugMessage(`Setting avatar URL: ${url}`);
        setAvatarUrl(url);
        setIsLoading(false);
      } else {
        addDebugMessage('No valid URL found in avatar event');
      }
    });
    
    // Handle avatar processing status
    newSocket.on('avatar-processing', (data) => {
      addDebugMessage(`Avatar processing status: ${data?.isProcessing}`);
      if (data && data.isProcessing === false) {
        // The avatar processing is complete, but we're waiting for results
        addDebugMessage('Avatar processing complete, waiting for result URL');
      }
    });
    
    // Handle error messages
    newSocket.on('error', (error) => {
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error';
      addDebugMessage(`Server error: ${errorMessage}`);
      setError(`Server error: ${errorMessage}`);
      setIsLoading(false);
    });
    
    setSocket(newSocket);
    
    // Setup reconnection timeout - if we can't connect after 8 seconds, show a message
    const connectionTimeout = setTimeout(() => {
      if (!isConnected) {
        addDebugMessage('Connection timeout - enabling offline mode');
        setError('Backend server not available. Using offline mode with sample responses.');
      }
    }, 8000);
    
    // Cleanup on unmount
    return () => {
      clearTimeout(connectionTimeout);
      newSocket.disconnect();
    };
  }, []);
  
  const addDebugMessage = (message: string) => {
    setDebug(prev => [...prev.slice(-9), message]);
  };
  
  // Server request: Handle form submission
  const handleQuerySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { 
      text: query,
      isUser: true,
      timestamp: new Date()
    }]);
    
    // Show loading state
    setIsLoading(true);
    addDebugMessage(`Sending query: ${query}`);
    
    // Function to generate offline response
    const generateOfflineResponse = () => {
      // Sample responses for common queries
      const sampleResponses: Record<string, string> = {
        'what is the idms erp system': 'The IDMS ERP System is a comprehensive enterprise resource planning solution designed specifically for manufacturing industries. It helps businesses streamline Sales, Purchase, Inventory, Production, Quality Control, Dispatch, Finance, and Accounts while ensuring full compliance with GST regulations.',
        'what are the main modules of idms': 'IDMS ERP consists of the following major modules: Sales & NPD, Planning, Purchase, Stores, Production, Maintenance, Quality, Dispatch & Logistics, HR & Admin, Accounts & Finance, and Settings.',
        'how does idms help with gst compliance': 'IDMS ERP integrates GST into every transaction, ensuring automatic tax calculations, validation of GSTIN, real-time invoice generation, and GST return filing support (GSTR-1, GSTR-3B, etc.).',
        'explain the sales module': 'The Sales Module manages customer orders, invoices, shipments, and payments. It handles B2B Customers data, SKU Master information, Payment Terms, and Logistics details. Transactions include Quotation, Sales Order (SO), Dispatch Request (DRN), Advanced Shipment Notice (ASN), Proforma Invoice, Service Invoice, E-Way Bill, Sales Credit/Debit Notes, and Cancellation of SO/DRN.',
        'hello': 'Hello! I am the IDMS AI Assistant. How can I help you with information about the IDMS ERP system today?',
        'hi': 'Hi there! I am the IDMS AI Assistant. How can I help you with information about the IDMS ERP system today?'
      };
      
      // Normalize the query for lookup
      const normalizedQuery = query.toLowerCase().trim();
      
      // Find the best matching sample response or use a default
      let response = 'I\'m currently in offline mode due to connection issues with the backend server. I have limited knowledge in this state, but I can still try to help with basic information about the IDMS ERP system.';
      
      // Check for exact matches
      for (const [key, value] of Object.entries(sampleResponses)) {
        if (normalizedQuery.includes(key)) {
          response = value;
          break;
        }
      }
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: response, 
          isUser: false, 
          timestamp: new Date() 
        }]);
        setIsLoading(false);
        
        // For demo purposes, show a sample avatar when in offline mode
        if (query.toLowerCase().includes('avatar') || Math.random() > 0.5) {
          // Use the sample video URL
          setTimeout(() => {
            const sampleVideoUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
            setAvatarUrl(sampleVideoUrl);
            addDebugMessage('Using sample avatar video in offline mode');
          }, 1000);
        }
      }, 1500); // Simulate network delay
    };
    
    // Try to send the query to the server
    try {
      if (socket && socket.connected) {
        // Existing socket emit code
        socket.emit('user-message', { 
          text: query,
          options: {
            voice: true,
            avatar: true,
            conversationId: 'conversation-' + Date.now()
          }
        });
        addDebugMessage('Query sent via socket with Format 1');
        
        // Set up fallback formats to try if the first doesn't work
        const altFormats = [
          // Format 2: Simple message property only
          { message: query },
          // Format 3: Text directly with no options
          query,
          // Format 4: Text with different options structure
          { text: query, model: 'gemini', voice: true }
        ];
        
        // Try alternative formats after a delay if needed
        let formatIndex = 0;
        const tryNextFormat = () => {
          if (formatIndex < altFormats.length) {
            setTimeout(() => {
              const format = altFormats[formatIndex];
              socket.emit('user-message', format);
              addDebugMessage(`Trying alternative format ${formatIndex + 1}: ${JSON.stringify(format)}`);
              formatIndex++;
              tryNextFormat();
            }, 2000); // 2 second delay between attempts
          }
        };
        
        // Start timeout to try alternatives if needed
        setTimeout(tryNextFormat, 5000);
      } else {
        addDebugMessage('Socket not connected! Using offline mode...');
        generateOfflineResponse();
      }
    } catch (error) {
      console.error('Error sending query:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addDebugMessage(`Error sending query: ${errorMessage}`);
      
      // Generate offline response on error
      generateOfflineResponse();
    }
    
    // Clear input
    setQuery('');
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle voice input
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addDebugMessage('Speech recognition not supported in this browser');
      return;
    }
    
    addDebugMessage('Starting voice recording...');
    
    // @ts-ignore - TypeScript doesn't know about webkitSpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListening(true);
      addDebugMessage('Voice recording started');
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      addDebugMessage(`Voice input: ${transcript}`);
      
      // Auto-submit after voice input
      setTimeout(() => {
        handleQuerySubmit(new Event('submit') as any);
      }, 500);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      addDebugMessage(`Voice recording error: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      addDebugMessage('Voice recording ended');
    };
    
    recognition.start();
  };

  return (
    <div className="flex flex-col min-h-screen p-4">
      {/* Header */}
      <header className="flex items-center justify-between py-4 px-6 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md rounded-xl shadow-sm mb-6">
        <h1 className="text-2xl font-bold text-gradient">AI Avatar Assistant</h1>
        <div className="flex items-center gap-4">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <ThemeToggle />
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left: Chat history */}
        <div className="lg:col-span-2 flex flex-col bg-white dark:bg-dark-800 rounded-xl shadow-sm overflow-hidden">
          {/* Message list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Welcome to AI Avatar Assistant</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                  Ask questions about the IDMS ERP system. You can use text or voice input to interact with the AI assistant.
                </p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
                  <button
                    onClick={() => setQuery("What is the IDMS ERP System?")}
                    className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 text-left"
                  >
                    What is the IDMS ERP System?
                  </button>
                  <button
                    onClick={() => setQuery("What are the main modules of IDMS?")}
                    className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 text-left"
                  >
                    What are the main modules of IDMS?
                  </button>
                  <button
                    onClick={() => setQuery("How does IDMS help with GST compliance?")}
                    className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 text-left"
                  >
                    How does IDMS help with GST compliance?
                  </button>
                  <button
                    onClick={() => setQuery("Explain the Sales Module")}
                    className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 text-left"
                  >
                    Explain the Sales Module
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <ChatMessage
                  key={index}
                  message={msg.text}
                  isUser={msg.isUser}
                  timestamp={msg.timestamp}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
              
          {/* Input form */}
          <form onSubmit={handleQuerySubmit} className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={startVoiceInput}
                disabled={!isConnected || isLoading || isListening}
                className={`p-2 rounded-lg ${isListening 
                  ? 'bg-red-500 text-white' 
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'} 
                  hover:opacity-90 disabled:opacity-50`}
                title="Voice input"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                type="submit"
                disabled={!isConnected || isLoading || !query.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            {error && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Right: Avatar display */}
        <div className="flex flex-col space-y-6">
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 flex-grow">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">IDMS AI Avatar</h2>
            <AvatarRenderer 
              videoUrl={avatarUrl || undefined} 
              isLoading={isLoading} 
              addDebugMessage={addDebugMessage}
            />
            
            {/* Debug section */}
            <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-4 mt-6">
              <h3 className="text-sm font-semibold mb-2">Debug Controls</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2 p-2 rounded bg-gray-200 dark:bg-dark-700">
                  <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs">
                    {isConnected 
                      ? 'Connected to backend server' 
                      : 'Not connected to backend server (port 5001)'}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const testVideoUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
                      addDebugMessage(`Testing sample video: ${testVideoUrl}`);
                      setAvatarUrl(testVideoUrl);
                    }}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Test Sample Video
                  </button>
                  <button
                    onClick={() => {
                      // D-ID sample avatar URL with MP4 format
                      const testAvatarUrl = "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/google-oauth2%7C116288004709717527960/tlk_0qgTzVVPRHzDe-pVrRDSl/1718994615959.mp4";
                      addDebugMessage(`Testing D-ID avatar: ${testAvatarUrl}`);
                      setAvatarUrl(testAvatarUrl);
                    }}
                    className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                  >
                    Test Avatar Video
                  </button>
                  <button
                    onClick={() => {
                      setAvatarUrl('');
                      addDebugMessage('Avatar cleared');
                    }}
                    className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                  >
                    Clear Avatar
                  </button>
                  <button
                    onClick={() => {
                      if (socket) {
                        socket.disconnect();
                        setTimeout(() => {
                          addDebugMessage('Reconnecting socket to backend...');
                          socket.connect();
                        }, 1000);
                      }
                    }}
                    className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  >
                    Reconnect Socket
                  </button>
                </div>
                
                <div className="mt-2">
                  <h4 className="text-xs font-medium mb-1">Connection Details:</h4>
                  <div className="bg-black/10 dark:bg-black/20 p-2 rounded text-xs font-mono">
                    <div>Backend URL: http://localhost:5001</div>
                    <div>Status: {isConnected ? 'Connected ✓' : 'Disconnected ✗'}</div>
                    <div>Error: {error || 'None'}</div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-sm font-semibold mt-4 mb-2">Debug Messages:</h3>
              <div className="max-h-48 overflow-y-auto bg-white dark:bg-dark-900 p-2 rounded text-xs font-mono">
                {debug.map((msg, i) => (
                  <div key={i} className="text-gray-700 dark:text-gray-300">
                    {msg}
                  </div>
                ))}
                {debug.length === 0 && (
                  <div className="text-gray-400 italic">No debug messages yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} AI Avatar Assistant - All rights reserved</p>
      </footer>
      
      {/* CSS for typing indicator */}
      <style jsx>{`
        .typing-indicator {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 10px 0;
          padding: 10px;
        }
        
        .dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin: 0 4px;
          background-color: #6366f1;
          border-radius: 50%;
          opacity: 0.6;
          animation: dot-pulse 1.5s infinite ease-in-out;
        }
        
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes dot-pulse {
          0%, 100% {
            transform: scale(0.7);
            opacity: 0.4;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
} 