'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';

// Import components
import MessageBubble from '../components/MessageBubble';
import VoiceInput from '../components/VoiceInput';
import BackgroundEffects from '../components/BackgroundEffects';

// Import animation variants
import { fadeIn, slideUp, staggerContainer } from '../utils/animations';

// Custom types
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Add DID SDK type definition
declare global {
  interface Window {
    DID?: any;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Check D-ID SDK availability
if (typeof window !== 'undefined') {
  console.log('Checking D-ID SDK availability');
  // Log when the DID global object is set
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    if (prop === 'DID' && obj === window) {
      console.log('D-ID SDK being set on window object');
    }
    return originalDefineProperty(obj, prop, descriptor);
  };
  
  // Check if DID is already available
  setTimeout(() => {
    console.log('D-ID SDK after timeout:', window.DID ? 'Available' : 'Not available');
    if (window.DID) {
      console.log('D-ID SDK properties:', Object.keys(window.DID));
    }
  }, 5000);
}

export default function Home() {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [agentContainerVisible, setAgentContainerVisible] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const didAgentRef = useRef<HTMLDivElement>(null);

  // Initialize D-ID Agent 
  useEffect(() => {
    // Just update the debug element when connection status changes
    const updateStatus = setInterval(() => {
      const statusElement = document.getElementById('agent-status');
      if (statusElement) {
        if (isConnected) {
          statusElement.textContent = 'Backend connected, agent ready';
          statusElement.className = 'text-green-600 dark:text-green-400';
        } else {
          statusElement.textContent = 'Backend disconnected, agent may not respond';
          statusElement.className = 'text-red-600 dark:text-red-400';
        }
      }
    }, 1000);
    
    // Hide loading overlay when D-ID agent is loaded
    const hideLoadingOverlay = () => {
      const loadingOverlay = document.getElementById('agent-loading-overlay');
      const didAgent = document.querySelector('[data-component="did-agent"]');
      const sdkStatus = document.getElementById('sdk-status');
      
      if (loadingOverlay && didAgent) {
        // Check if D-ID agent has loaded
        if (typeof window !== 'undefined' && window.DID && window.DID.isLoaded) {
          loadingOverlay.style.display = 'none';
          if (sdkStatus) sdkStatus.textContent = 'Yes';
          // Set window property in a TypeScript-safe way
          if (typeof window !== 'undefined') {
            (window as any).didAgentLoaded = true;
          }
          console.log('D-ID agent loaded successfully');
        } else {
          // Try again in 1 second
          if (sdkStatus) sdkStatus.textContent = 'No';
          setTimeout(hideLoadingOverlay, 1000);
        }
      }
    };
    
    // Check initially and start checking for agent load
    hideLoadingOverlay();
    
    // Handle D-ID specific errors in Vercel
    const checkVercelDIDIssues = () => {
      if (typeof window !== 'undefined') {
        // Check for Vercel-specific issues
        const isVercel = window.location.hostname.includes('vercel.app');
        if (isVercel) {
          console.log('Running on Vercel deployment, checking for D-ID agent');
          
          // Check if D-ID agent script loaded
          const didScript = document.querySelector('script[src*="d-id.com"]');
          if (!didScript) {
            console.error('D-ID script tag not found in document');
            const errorEl = document.getElementById('did-error');
            if (errorEl) errorEl.textContent = 'D-ID script tag not found';
          }
          
          // Add extra debugging info
          window.addEventListener('error', (event) => {
            console.error('Caught error:', event.message);
            const errorEl = document.getElementById('did-error');
            if (errorEl) errorEl.textContent = event.message;
          });
        }
      }
    };
    
    checkVercelDIDIssues();
    
    return () => clearInterval(updateStatus);
  }, [isConnected]);

  // Setup theme detection
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);

    // Listen for changes in theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Connect to Socket.io server
  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
      setError(`Connection error: ${err.message}`);
    });

    // Handle AI responses
    newSocket.on('ai-response', (data) => {
      console.log('Received AI response:', data);
      setIsLoading(false);

      // Extract text from response
      let responseText = '';
      if (typeof data === 'string') {
        responseText = data;
      } else if (data && typeof data === 'object') {
        responseText = data.text || data.answer || data.response || data.content || '';
      }

      if (responseText) {
        addMessage(responseText, false);
      }
    });

    // Handle errors
    newSocket.on('error', (error) => {
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error';
      console.error('Server error:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Add a message to the chat
  const addMessage = useCallback((text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setTimeout(() => scrollToBottom(), 100);
  }, []);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send message to server
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    // Add user message to chat
    addMessage(text, true);
    setInputValue('');
    setIsLoading(true);

    // Send to server if connected
    if (socket && socket.connected) {
      socket.emit('user-message', {
        message: text,
        // Disable built-in avatar since we're using D-ID
        avatar: false
      });
    } else {
      setError('Server connection not available. Please try again later.');
      setIsLoading(false);
    }
  }, [socket, addMessage]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Handle voice input
  const handleVoiceInput = (text: string) => {
    setInputValue(text);
    // Auto-send after voice input
    setTimeout(() => sendMessage(text), 500);
  };

  // Toggle agent container visibility (mobile-friendly)
  const toggleAgentContainer = () => {
    setAgentContainerVisible(prev => !prev);
  };

  // Suggested queries
  const suggestedQueries = [
    "What is the IDMS ERP system?",
    "Explain the Sales Module",
    "How does IDMS help with GST compliance?",
  ];

  // Check for D-ID element existence
  useEffect(() => {
    // Update D-ID element status
    const updateDIDElementStatus = () => {
      const statusElement = document.getElementById('did-element-status');
      const didElement = document.querySelector('did-agent');
      
      if (statusElement) {
        if (didElement) {
          statusElement.textContent = 'Found';
          statusElement.className = 'text-green-400';
          console.log('D-ID agent element found in DOM');
        } else {
          statusElement.textContent = 'Not found';
          statusElement.className = 'text-red-400';
          console.log('D-ID agent element NOT found in DOM');
        }
      }
    };

    // Check initially and then periodically
    updateDIDElementStatus();
    const checkInterval = setInterval(updateDIDElementStatus, 5000);
    
    // Special handling for Vercel environment
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      console.log('Vercel environment detected, applying special D-ID handling');
      
      // Ensure did-agent element exists
      setTimeout(() => {
        const didContainer = document.getElementById('did-container');
        if (didContainer && !document.querySelector('did-agent')) {
          console.log('Forcing creation of did-agent element on Vercel');
          didContainer.innerHTML = '<did-agent></did-agent>';
        }
      }, 3000);
    }
    
    return () => clearInterval(checkInterval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 text-gray-900 dark:text-gray-100">
      {/* Background particles */}
      <BackgroundEffects particleCount={20} isDarkMode={isDarkMode} />

      {/* Main container */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* App header */}
        <motion.header 
          className="mb-6 text-center"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            AI Avatar Assistant
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Interact with your intelligent assistant
          </p>
        </motion.header>

        {/* Main content area */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Agent container */}
          <motion.div 
            className={`relative w-full md:w-1/2 h-[300px] md:h-[450px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl overflow-hidden ${
              agentContainerVisible ? 'block' : 'hidden md:block'
            }`}
            variants={slideUp}
            initial="initial"
            animate="animate"
          >
            {/* Agent container with both div container and direct element */}
            <div ref={didAgentRef} className="w-full h-full flex items-center justify-center">
              <div 
                id="did-container"
                className="w-full h-full"
              >
                {/* Direct D-ID agent element - works better on Vercel */}
                <div dangerouslySetInnerHTML={{ __html: '<did-agent></did-agent>' }} />
              </div>
            </div>
            
            {/* Loading overlay - shows while agent loads */}
            <div id="agent-loading-overlay" className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-10">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-white text-sm">Loading virtual assistant...</p>
              </div>
            </div>
            
            {/* Enhanced debug info with Vercel troubleshooting */}
            <div className="absolute bottom-4 left-4 p-3 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white z-20">
              <div className="font-bold mb-1">Debug Info:</div>
              <div id="agent-status">
                {isConnected ? 
                  <span className="text-green-400">Backend connected, agent ready</span> : 
                  <span className="text-red-400">Backend disconnected, agent may not respond</span>
                }
              </div>
              <div className="text-xs mt-1">
                <div>D-ID SDK Loaded: <span id="sdk-status">{typeof window !== 'undefined' && window.DID ? 'Yes' : 'No'}</span></div>
                <div>Error: <span id="did-error" className="text-red-400">None reported</span></div>
                <div>Domain: <span>{typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</span></div>
                <div>Vercel Deployment: <span>{process.env.VERCEL_ENV || 'N/A'}</span></div>
                <div>D-ID Element: <span id="did-element-status">Checking...</span></div>
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/60 backdrop-blur-sm py-1.5 px-3 rounded-full text-xs text-white z-20">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>

            {/* Mobile toggle button */}
            <button 
              className="md:hidden absolute bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-20"
              onClick={toggleAgentContainer}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </motion.div>

          {/* Chat container */}
          <motion.div 
            className={`w-full md:w-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col ${
              !agentContainerVisible ? 'block' : 'hidden md:block'
            }`}
            variants={slideUp}
            initial="initial"
            animate="animate"
          >
            {/* Chat messages */}
            <motion.div 
              className="flex-1 p-4 overflow-y-auto"
              ref={chatContainerRef}
              variants={staggerContainer}
            >
              <AnimatePresence>
                {messages.length === 0 ? (
                  <motion.div 
                    className="h-full flex flex-col items-center justify-center text-center p-6"
                    variants={fadeIn}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">How can I help you today?</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                      Ask me any questions about the IDMS ERP system. I'm here to assist you!
                    </p>

                    {/* Suggestion chips */}
                    <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-md">
                      {suggestedQueries.map((query) => (
                        <motion.button
                          key={query}
                          onClick={() => sendMessage(query)}
                          className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 text-left"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {query}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message.text}
                        isUser={message.isUser}
                        timestamp={message.timestamp}
                      />
                    ))}
                    {isLoading && (
                      <div className="self-start bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-2xl px-4 py-3 max-w-[85%]">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Error message */}
            {error && (
              <div className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Input area */}
            <motion.div 
              className="p-4 border-t border-gray-200 dark:border-gray-700"
              variants={slideUp}
              initial="initial"
              animate="animate"
            >
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full p-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={isLoading}
                  />
                </div>
                <VoiceInput
                  onSpeechResult={handleVoiceInput}
                  onListeningChange={setIsListening}
                  buttonSize="md"
                />
                <motion.button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow"
                  disabled={!inputValue.trim() || isLoading || isListening}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </motion.button>
              </form>

              {/* Suggestion chips - shown when chat is not empty */}
              {messages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestedQueries.map((query) => (
                    <motion.button
                      key={query}
                      onClick={() => sendMessage(query)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {query}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Mobile toggle button - for responsive design */}
            <button 
              className="md:hidden absolute bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg"
              onClick={toggleAgentContainer}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8 pb-4">
        <p>© {new Date().getFullYear()} AI Avatar Assistant - Powered by D-ID and Gemini</p>
      </footer>
    </div>
  );
} 