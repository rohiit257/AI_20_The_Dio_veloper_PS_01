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
  const [isProcessingVoiceInput, setIsProcessingVoiceInput] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Initializing');
  const [avatarMood, setAvatarMood] = useState('neutral');
  const [isMuted, setIsMuted] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const didAgentRef = useRef<HTMLDivElement>(null);

  // Initialize D-ID Agent 
  useEffect(() => {
    // Set initial loading stage
    setLoadingStage('Initializing systems');
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        
        // Update loading stage based on progress
        if (prev === 10) setLoadingStage('Loading neural pathways');
        if (prev === 30) setLoadingStage('Connecting to backend services');
        if (prev === 50) setLoadingStage('Activating avatar systems');
        if (prev === 70) setLoadingStage('Synchronizing voice patterns');
        if (prev === 90) setLoadingStage('Finalizing connection');
        
        return prev + 1;
      });
    }, 100);
    
    // Hide loading overlay when D-ID agent is loaded
    const hideLoadingOverlay = () => {
      const loadingOverlay = document.getElementById('agent-loading-overlay');
      const didAgent = document.querySelector('[data-component="did-agent"]');
      
      if (loadingOverlay && didAgent) {
        // Check if D-ID agent has loaded
        if (typeof window !== 'undefined' && window.DID && window.DID.isLoaded) {
          // Set progress to 100% when loaded
          setLoadingProgress(100);
          setLoadingStage('Connection established');
          
          // Fade out the overlay after a short delay
          setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
              loadingOverlay.style.display = 'none';
            }, 500);
          }, 1000);
          
          console.log('D-ID agent loaded successfully');
        } else {
          // Try again in 1 second
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
    
    return () => {
      clearInterval(progressInterval);
    };
  }, []);

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

    // Add this inside the bot-message handler:
    // Trigger D-ID agent to speak if SDK is loaded and message has content
    newSocket.on('bot-message', (data) => {
      if (typeof window !== 'undefined' && window.DID && window.DID.speak && data.message) {
        try {
          window.DID.speak({
            text: data.message,
            provider: { type: 'microsoft' },
            config: { 
              fluent: true,
              pad_audio: 0,
              stitch: true
            }
          });
        } catch (error) {
          console.error('Error making D-ID agent speak:', error);
        }
      }
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

  // Handle voice input - improve this function to ensure messages are sent
  const handleVoiceInput = (text: string) => {
    console.log("Voice input received:", text); // Debug log
    
    if (!text.trim()) {
      console.log("Empty text, not sending"); 
      return;
    }
    
    // Remove filler words and clean up text
    const cleanedText = text.trim()
      .replace(/^(um|uh|like|so|well|you know|basically)\s+/gi, '')
      .replace(/\s+(um|uh)\s+/gi, ' ')
      .replace(/[.!?]$/g, '');
    
    console.log("Cleaned text:", cleanedText); // Debug log
    
    // Only process if we have meaningful text after cleaning
    if (cleanedText && cleanedText.length > 1) {
      // Force UI update before sending
      setIsProcessingVoiceInput(true);
      
      // Small delay to ensure the UI is updated
      setTimeout(() => {
        // Use the existing sendMessage function with force parameter
        sendMessage(cleanedText);
        
        // Clear processing state after sending
        setTimeout(() => {
          setIsProcessingVoiceInput(false);
        }, 500);
      }, 100);
    } else {
      console.log("Text too short after cleaning, not sending");
      setIsProcessingVoiceInput(false);
    }
  };

  // Add this function to handle listening state changes 
  const handleVoiceListeningChange = (isListening: boolean) => {
    setIsListening(isListening);
    
    // Trigger D-ID agent speaking animation on listening
    if (typeof window !== 'undefined' && window.DID) {
      try {
        // When user starts listening, show agent is attentive
        if (isListening) {
          // Trigger a subtle "listening" animation if DID SDK supports it
          if (window.DID.setIntent) {
            window.DID.setIntent('listening');
          }
        } else {
          // When user stops listening, reset agent intent
          if (window.DID.setIntent) {
            window.DID.setIntent('neutral');
          }
        }
      } catch (error) {
        console.error('Error communicating with D-ID agent:', error);
      }
    }
  };

  // Toggle agent container visibility (mobile-friendly)
  const toggleAgentContainer = () => {
    setAgentContainerVisible(prev => !prev);
  };

  // Toggle debug panel
  const toggleDebugPanel = () => {
    setIsDebugExpanded(prev => !prev);
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

  // Add useEffect for sound wave animation
  useEffect(() => {
    if (!isListening) return;
    
    // Update the sound wave heights based on volume
    const updateSoundWaves = () => {
      const waves = document.querySelectorAll('.sound-wave-bar');
      
      waves.forEach((wave, i) => {
        const element = wave as HTMLElement;
        const height = Math.max(15, Math.min(80, 
          20 + Math.sin(Date.now() / (500 + i * 50)) * 20 + (volume * 60)
        ));
        
        if (element) {
          element.style.height = `${height}%`;
        }
      });
      
      if (isListening) {
        requestAnimationFrame(updateSoundWaves);
      }
    };
    
    // Start the animation
    const animationId = requestAnimationFrame(updateSoundWaves);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isListening, volume]);

  // Function to change avatar mood
  const changeAvatarMood = (mood: string) => {
    setAvatarMood(mood);
    
    // Update D-ID agent mood if SDK available
    if (typeof window !== 'undefined' && window.DID && window.DID.setIntent) {
      try {
        window.DID.setIntent(mood);
      } catch (error) {
        console.error('Error setting D-ID mood:', error);
      }
    }
  };

  // Function to toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // Update D-ID agent if SDK available
    if (typeof window !== 'undefined' && window.DID) {
      try {
        if (!isMuted) {
          // Mute
          if (window.DID.setVolume) window.DID.setVolume(0);
        } else {
          // Unmute
          if (window.DID.setVolume) window.DID.setVolume(1);
        }
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    }
  };

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
            } ${isListening ? 'did-agent-listening avatar-listening' : ''}`}
            variants={slideUp}
            initial="initial"
            animate="animate"
          >
            {/* Avatar glow effect */}
            <div className="avatar-glow"></div>
            
            {/* Agent container with both div container and direct element */}
            <div ref={didAgentRef} className="w-full h-full flex items-center justify-center">
              <div 
                id="did-container"
                className="w-full h-full"

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
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
  {messages.length === 0 ? (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      {/* Welcome message and buttons */}
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
                {/* Direct D-ID agent element with enhanced attributes */}
                <div dangerouslySetInnerHTML={{ 
                  __html: `<did-agent 
                    id="did-agent" 
                    class="did-agent ${isListening ? 'voice-active' : ''}" 
                    data-name="Virtual Assistant" 
                    data-mode="video" 
                    data-client-key="${process.env.NEXT_PUBLIC_DID_API_KEY || ''}" 
                    data-agent-id="${process.env.NEXT_PUBLIC_DID_AGENT_ID || ''}" 
                    data-wait-time="10000"
                    data-autoplay="true"
                  ></did-agent>` 
                }} />
              </div>
            </div>
            
            {/* Interactive Avatar Interface with neural network visualization */}
            <div id="agent-loading-overlay" className="entity-init-overlay absolute inset-0 flex flex-col items-center justify-center z-10 transition-opacity duration-500">
              {/* Neural network background */}
              <div className="neural-network-grid w-full h-full neural-pulse"></div>
              
              {/* Neural connections */}
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div 
                    key={i}
                    className="neural-connection"
                    style={{ 
                      top: `${Math.random() * 100}%`, 
                      left: `${Math.random() * 100}%`,
                      transform: `rotate(${Math.random() * 360}deg)`,
                      animationDelay: `${Math.random() * 2}s`,
                      width: `${50 + Math.random() * 100}px`
                    }}
                  ></div>
                ))}
              </div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="entity-logo relative mb-8">
                  <div className="w-24 h-24 rounded-full bg-blue-500/20 animate-ping absolute inset-0"></div>
                  <div className="w-24 h-24 rounded-full bg-indigo-900 border-2 border-blue-400 flex items-center justify-center relative z-10">
                    <svg viewBox="0 0 24 24" className="w-12 h-12 text-blue-400 animate-pulse" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 6.75V15M15 9V17.25M7.5 12H10.5M13.5 14.25H16.5M6.75 19.5H17.25C18.4926 19.5 19.5 18.4926 19.5 17.25V6.75C19.5 5.50736 18.4926 4.5 17.25 4.5H6.75C5.50736 4.5 4.5 5.50736 4.5 6.75V17.25C4.5 18.4926 5.50736 19.5 6.75 19.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-xl font-medium text-white mb-2">AI Entity Initialization</h3>
                  <p className="text-blue-300 text-sm mb-1">{loadingStage}</p>
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-64 h-1.5 bg-gray-700 rounded-full mb-4 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    style={{ width: `${loadingProgress}%`, transition: 'width 0.5s ease' }}
                  ></div>
                </div>
                
                {/* Progress percentage */}
                <div className="text-blue-300 text-sm mb-8">
                  {loadingProgress}% Complete
                </div>
                
                {/* Button for manual initialization if needed */}
                {loadingProgress < 100 && loadingProgress > 0 && (
                  <button 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition transform hover:scale-105 active:scale-95 flex items-center"
                    onClick={() => {
                      // Force reload the agent
                      const didContainer = document.getElementById('did-container');
                      if (didContainer) {
                        didContainer.innerHTML = '';
                        setTimeout(() => {
                          didContainer.innerHTML = `<did-agent 
                            id="did-agent" 
                            class="did-agent" 
                            data-name="Virtual Assistant" 
                            data-mode="video" 
                            data-client-key="${process.env.NEXT_PUBLIC_DID_API_KEY || ''}" 
                            data-agent-id="${process.env.NEXT_PUBLIC_DID_AGENT_ID || ''}" 
                            data-wait-time="10000"
                            data-autoplay="true"
                          ></did-agent>`;
                        }, 100);
                      }
                    }}
                  >
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Force Initialize
                  </button>
                )}
              </div>
            </div>
            
            {/* Mood indicator */}
            <div className="absolute top-4 left-4 z-20 mood-indicator">
              <div className={`mood-dot ${
                avatarMood === 'neutral' ? 'mood-attentive' :
                avatarMood === 'thinking' ? 'mood-thinking' : 
                'mood-speaking'
              }`}></div>
              <span className="text-white">
                {avatarMood === 'neutral' ? 'Attentive' :
                 avatarMood === 'thinking' ? 'Thinking' : 
                 avatarMood === 'speaking' ? 'Speaking' : 
                 'Active'}
              </span>
            </div>
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
                  onListeningChange={handleVoiceListeningChange}
                  onVolumeChange={setVolume}
                  buttonSize="md"
                  language="en-US"
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

      {/* Voice active indicator - only visible when listening */}
      {isListening && (
        <>
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-blue-500/40 backdrop-blur-sm px-3 py-1.5 rounded-full z-20">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-xs text-white font-medium">Listening...</span>
          </div>
          
          {/* Sound wave visualization around the avatar */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute -inset-1 border-4 border-blue-500/20 rounded-2xl"></div>
            <div className="absolute -inset-2 border-2 border-blue-400/10 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-blue-500/30 to-transparent"></div>
            
            {/* Animated sound waves */}
            <div className="absolute bottom-0 w-full flex justify-evenly h-12 items-end overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i}
                  className="w-1 bg-blue-400/50 rounded-full transform sound-wave-bar"
                  style={{ 
                    height: '20%',
                    transition: 'height 150ms ease'
                  }}
                ></div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Interactive AI status bubbles (always visible) */}
      <div className="absolute right-4 bottom-4 z-30">
        <div className="flex flex-col items-end space-y-2">
          {/* Connection status */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span>{isConnected ? 'Connected' : 'Offline'}</span>
          </div>
          
          {/* AI state - changes based on activity */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium
            ${isListening ? 'bg-blue-500/20 text-blue-400' : 
            isLoading ? 'bg-yellow-500/20 text-yellow-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
            <div className={`w-2 h-2 rounded-full 
              ${isListening ? 'bg-blue-500 animate-pulse' : 
              isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-indigo-500'}`}></div>
            <span>{isListening ? 'Listening' : isLoading ? 'Processing' : 'Ready'}</span>
          </div>
        </div>
      </div>

      {/* Immersive voice interface that appears when listening */}
      {isListening && (
        <div className="absolute inset-0 z-25 pointer-events-none overflow-hidden">
          {/* Circular pulse */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96">
            <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute inset-8 border-4 border-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-16 border-4 border-blue-500/30 rounded-full animate-ping" style={{ animationDuration: '1.5s' }}></div>
          </div>
          
          {/* Voice level indicator */}
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
            <div className="mb-4 text-sm text-white/70 backdrop-blur-sm bg-black/20 px-3 py-1 rounded-full">
              Volume: {Math.round((volume || 0) * 100)}%
            </div>
            
            <div className="w-64 h-24 flex items-end justify-center space-x-1">
              {Array.from({ length: 20 }).map((_, i) => {
                const dynamicHeight = Math.max(
                  10, 
                  Math.min(100, 
                    20 + Math.sin((Date.now() / (400 + i * 50)) + i) * 20 + (volume * 60)
                  )
                );
                
                return (
                  <div 
                    key={i}
                    className="w-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm"
                    style={{ 
                      height: `${dynamicHeight}%`,
                      opacity: 0.7 + (dynamicHeight / 200),
                      transition: 'height 100ms ease-out'
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced interactive control panel - always visible */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 flex items-center space-x-3">
        {/* Mute/unmute button */}
        <button 
          className={`control-btn ${isMuted ? 'bg-red-500/30' : ''}`}
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        {/* Reset button */}
        <button 
          className="control-btn"
          onClick={() => {
            // Reset the agent
            if (window.DID && window.DID.reset) {
              window.DID.reset();
            }
          }}
          title="Reset Avatar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Fullscreen toggle */}
        <button 
          className="control-btn"
          onClick={toggleAgentContainer}
          title="Toggle Fullscreen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Divider */}
        <div className="h-6 w-px bg-gray-500/30"></div>
        
        {/* Mood controls */}
        <button 
          className={`control-btn ${avatarMood === 'neutral' ? 'bg-blue-500/30' : ''}`}
          onClick={() => changeAvatarMood('neutral')}
          title="Neutral Mood"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button 
          className={`control-btn ${avatarMood === 'thinking' ? 'bg-blue-500/30' : ''}`}
          onClick={() => changeAvatarMood('thinking')}
          title="Thinking Mood"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button 
          className={`control-btn ${avatarMood === 'speaking' ? 'bg-blue-500/30' : ''}`}
          onClick={() => changeAvatarMood('speaking')}
          title="Speaking Mood"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8 pb-4">
        <p>© {new Date().getFullYear()} AI Avatar Assistant - Powered by D-ID and Gemini</p>
      </footer>
    </div>
  );
} 