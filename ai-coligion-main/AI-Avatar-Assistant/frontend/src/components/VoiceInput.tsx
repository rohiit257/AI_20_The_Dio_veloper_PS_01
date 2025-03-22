import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface VoiceInputProps {
  onSpeechResult: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  buttonSize?: 'sm' | 'md' | 'lg';
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onSpeechResult,
  onListeningChange,
  buttonSize = 'md',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState(true);

  // Size classes based on buttonSize prop
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };

  // Check for browser support
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && 
        !('SpeechRecognition' in window)) {
      setHasRecognitionSupport(false);
    }
  }, []);

  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening]);

  // Start listening for speech
  const startListening = useCallback(() => {
    setIsListening(true);
    onListeningChange?.(true);
    setTranscript('');

    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      stopListening();
    };
    
    recognition.onend = () => {
      // Only submit if we have a transcript and we're still listening
      // (to prevent submitting when stopped manually)
      if (transcript && isListening) {
        onSpeechResult(transcript);
      }
      stopListening();
    };
    
    // Start the recognition
    recognition.start();
    
    // Store recognition instance for cleanup
    window.recognition = recognition;
  }, [onSpeechResult, onListeningChange]);

  // Stop listening
  const stopListening = useCallback(() => {
    setIsListening(false);
    onListeningChange?.(false);
    
    if (window.recognition) {
      window.recognition.stop();
    }
  }, [onListeningChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (window.recognition) {
        window.recognition.stop();
      }
    };
  }, []);

  // Animation variants
  const buttonVariants = {
    idle: { scale: 1 },
    active: { 
      scale: [1, 1.05, 1],
      transition: {
        repeat: Infinity,
        duration: 1.5
      }
    },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  const waveVariants = {
    idle: { 
      opacity: 0,
      scale: 1 
    },
    active: { 
      opacity: [0, 0.3, 0],
      scale: [1, 1.5, 1.8],
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  };

  if (!hasRecognitionSupport) {
    return (
      <button 
        className="opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center"
        disabled
        title="Voice input not supported in this browser"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Animated waves for active state */}
      <motion.div
        className={`absolute inset-0 rounded-full bg-blue-500 dark:bg-blue-400 ${sizeClasses[buttonSize]}`}
        variants={waveVariants}
        animate={isListening ? 'active' : 'idle'}
      />
      
      {/* Main button */}
      <motion.button
        className={`relative ${sizeClasses[buttonSize]} ${isListening 
          ? 'bg-red-500 text-white' 
          : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'} 
          rounded-full flex items-center justify-center shadow-lg hover:shadow-blue-500/20`}
        onClick={toggleListening}
        variants={buttonVariants}
        initial="idle"
        animate={isListening ? 'active' : 'idle'}
        whileHover="hover"
        whileTap="tap"
        title={isListening ? "Stop listening" : "Voice input"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isListening ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          )}
        </svg>
      </motion.button>
      
      {/* Transcript display */}
      {isListening && transcript && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg text-sm text-gray-700 dark:text-gray-300 min-w-[150px] text-center">
          {transcript}
        </div>
      )}
    </div>
  );
};

// Add TypeScript definitions for window object
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
    recognition?: any;
  }
}

export default VoiceInput; 