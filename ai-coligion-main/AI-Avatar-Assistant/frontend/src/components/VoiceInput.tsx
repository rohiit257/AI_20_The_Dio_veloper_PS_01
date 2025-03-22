import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface VoiceInputProps {
  onSpeechResult: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  onVolumeChange?: (volume: number) => void;
  buttonSize?: 'sm' | 'md' | 'lg';
  language?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onSpeechResult,
  onListeningChange,
  onVolumeChange,
  buttonSize = 'md',
  language = 'en-US',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      setError('Speech recognition not supported by your browser');
    }
  }, []);

  // Handle mic permission
  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analyzer to detect volume
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Volume meter
      const updateVolume = () => {
        if (!isListening) return;
        
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalizedVolume = average / 128; // Scale to 0-1 range
        
        setVolume(normalizedVolume);
        // Pass volume data to parent component if callback exists
        onVolumeChange?.(normalizedVolume);
        
        if (isListening) {
          requestAnimationFrame(updateVolume);
        }
      };
      
      updateVolume();
      return stream;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied');
      setIsListening(false);
      onListeningChange?.(false);
      return null;
    }
  }, [isListening, onListeningChange, onVolumeChange]);

  // Toggle listening state
  const toggleListening = useCallback(async () => {
    setError(null);
    
    if (isListening) {
      stopListening();
    } else {
      const stream = await requestMicrophonePermission();
      if (stream) {
        startListening(stream);
      }
    }
  }, [isListening, requestMicrophonePermission]);

  // Start listening for speech
  const startListening = useCallback((stream: MediaStream) => {
    setIsListening(true);
    onListeningChange?.(true);
    setTranscript('');

    try {
      // Create speech recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      
      // Set automatic timeout (30 seconds)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (isListening) {
          if (transcript) {
            onSpeechResult(transcript);
          }
          stopListening();
        }
      }, 30000);
      
      recognition.onstart = () => {
        setIsListening(true);
        onListeningChange?.(true);
      };
      
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        
        // If high confidence final result, submit immediately
        if (event.results[current].isFinal && event.results[current][0].confidence > 0.8) {
          onSpeechResult(transcriptText);
          stopListening();
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setError(`Recognition error: ${event.error}`);
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
      recognitionRef.current = recognition;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Failed to start speech recognition');
      stopListening();
    }
  }, [onSpeechResult, onListeningChange, language, transcript, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    setIsListening(false);
    onListeningChange?.(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
      recognitionRef.current = null;
    }
  }, [onListeningChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping recognition on unmount:', error);
        }
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
    active: (volume: number) => ({ 
      opacity: [0, Math.min(0.5, 0.2 + volume * 0.3), 0],
      scale: [1, 1.3 + volume * 0.5, 1.8],
      transition: {
        repeat: Infinity,
        duration: 1.5 - volume * 0.5, // Faster animation with louder volume
        ease: "easeInOut"
      }
    })
  };

  if (!hasRecognitionSupport) {
    return (
      <div className="relative">
        <button 
          className="opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center"
          disabled
          title="Voice input not supported in this browser"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </button>
        {error && (
          <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 rounded-lg p-2 shadow-lg text-xs max-w-[200px] text-center">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Animated waves for active state */}
      <motion.div
        className={`absolute inset-0 rounded-full bg-blue-500 dark:bg-blue-400 ${sizeClasses[buttonSize]}`}
        variants={waveVariants}
        animate={isListening ? 'active' : 'idle'}
        custom={volume}
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
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg text-sm text-gray-700 dark:text-gray-300 min-w-[200px] max-w-[300px] text-center">
          <div className="flex space-x-1 justify-center mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: '0.4s' }}></span>
          </div>
          {transcript}
        </div>
      )}
      
      {/* Error message */}
      {error && !isListening && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 rounded-lg p-2 shadow-lg text-xs max-w-[200px] text-center">
          {error}
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