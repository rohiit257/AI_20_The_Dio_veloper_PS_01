'use client';

import { useState, useEffect, useRef } from 'react';

interface AvatarRendererProps {
  videoUrl?: string;
  isLoading?: boolean;
  addDebugMessage?: (message: string) => void;
}

export default function AvatarRenderer({ videoUrl, isLoading, addDebugMessage }: AvatarRendererProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStatus, setVideoStatus] = useState<'idle' | 'loading' | 'playing' | 'ended' | 'error'>('idle');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [useFallbackVideo, setUseFallbackVideo] = useState(false);
  const fallbackVideoUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  
  // Debug logging helper
  const logDebug = (message: string) => {
    console.log(`[Avatar] ${message}`);
    addDebugMessage?.(`[Avatar] ${message}`);
  };

  // Check if the browser supports the video format
  const checkVideoSupport = (url: string) => {
    const video = document.createElement('video');
    
    // Check video format based on extension
    if (url.endsWith('.mp4')) {
      return video.canPlayType('video/mp4') ? 'probably' : 'maybe';
    } else if (url.endsWith('.webm')) {
      return video.canPlayType('video/webm') ? 'probably' : 'maybe';
    } else if (url.endsWith('.ogg')) {
      return video.canPlayType('video/ogg') ? 'probably' : 'maybe';
    } else if (url.endsWith('.mov')) {
      return video.canPlayType('video/quicktime') ? 'probably' : 'maybe';
    }
    
    // Try to detect some common content types
    return {
      mp4: video.canPlayType('video/mp4'),
      webm: video.canPlayType('video/webm'),
      ogg: video.canPlayType('video/ogg'),
      mov: video.canPlayType('video/quicktime')
    };
  };

  // Handle video URL changes
  useEffect(() => {
    if (!videoUrl) {
      setVideoStatus('idle');
      setVideoError(null);
      setUseFallbackVideo(false);
      return;
    }

    // Check format support
    const support = checkVideoSupport(videoUrl);
    if (typeof support === 'string') {
      logDebug(`Video format support: ${support}`);
    } else {
      logDebug(`Browser format support - mp4: ${support.mp4}, webm: ${support.webm}, ogg: ${support.ogg}, mov: ${support.mov}`);
    }

    // Set loading state immediately
    setVideoStatus('loading');
    setVideoError(null);
    logDebug(`Setting video source: ${videoUrl}`);
    
    // Set video source if reference exists
    if (videoRef.current) {
      // Create a timeout to detect if video doesn't load
      const timeoutId = setTimeout(() => {
        if (videoStatus === 'loading') {
          logDebug('Video loading timeout - might be an issue with the URL or format');
          setVideoError('Video loading timeout. There might be an issue with the URL or format.');
          
          // Try to use the fallback video instead
          if (!useFallbackVideo) {
            logDebug('Switching to fallback video due to timeout');
            setUseFallbackVideo(true);
          }
        }
      }, 5000);
      
      // Event handlers for video element
      const videoElement = videoRef.current;
      
      const handleCanPlay = () => {
        logDebug('Video can play now');
        clearTimeout(timeoutId);
        setVideoStatus('playing');
        
        // Attempt autoplay
        videoElement.muted = true;
        setIsMuted(true);
        videoElement.play().catch(e => {
          logDebug(`Autoplay failed: ${e.message}`);
          setShowControls(true);
        });
      };
      
      const handleError = (e: Event) => {
        clearTimeout(timeoutId);
        const error = (e.target as HTMLVideoElement).error;
        const errorMessage = error ? `Video error: ${error.code} - ${error.message}` : 'Unknown video error';
        logDebug(errorMessage);
        setVideoError(errorMessage);
        
        // Try fallback for format errors
        if (error && (error.code === 4 || errorMessage.includes('Format'))) {
          logDebug('Format error detected - trying fallback video');
          
          if (!useFallbackVideo) {
            setUseFallbackVideo(true);
          } else {
            setVideoStatus('error');
          }
        } else {
          setVideoStatus('error');
        }
      };
      
      const handleEnded = () => {
        logDebug('Video playback ended');
        setVideoStatus('ended');
      };
      
      // Add event listeners
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('error', handleError);
      videoElement.addEventListener('ended', handleEnded);
      
      // Set the src attribute to either the original URL or fallback
      videoElement.src = useFallbackVideo ? fallbackVideoUrl : videoUrl;
      
      // Clean up
      return () => {
        clearTimeout(timeoutId);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('error', handleError);
        videoElement.removeEventListener('ended', handleEnded);
        videoElement.src = '';
      };
    }
  }, [videoUrl, useFallbackVideo]);

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
      logDebug(`Audio ${videoRef.current.muted ? 'muted' : 'unmuted'}`);
    }
  };

  // Retry with original video
  const retryOriginalVideo = () => {
    if (videoUrl) {
      setUseFallbackVideo(false);
      setVideoStatus('loading');
      logDebug('Retrying with original video URL');
    }
  };

  // Use fallback video
  const useFallback = () => {
    setUseFallbackVideo(true);
    setVideoStatus('loading');
    logDebug('Switching to fallback video');
  };

  return (
    <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
      {/* Loading state */}
      {(isLoading || videoStatus === 'loading') && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-t-2 border-blue-500 border-solid rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isLoading ? 'Generating avatar...' : useFallbackVideo ? 'Loading fallback video...' : 'Loading video...'}
            </p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {videoStatus === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 backdrop-blur-sm z-10">
          <div className="text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">{videoError || 'Failed to load video'}</p>
            <div className="flex justify-center space-x-2 mt-2">
              <button 
                onClick={() => { if (videoUrl) { setVideoStatus('loading'); videoRef.current!.src = videoUrl; } }}
                className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs rounded hover:bg-red-200 dark:hover:bg-red-800/30"
              >
                Retry
              </button>
              {!useFallbackVideo && (
                <button 
                  onClick={useFallback}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs rounded hover:bg-blue-200 dark:hover:bg-blue-800/30"
                >
                  Use Sample Video
                </button>
              )}
              {useFallbackVideo && (
                <button 
                  onClick={retryOriginalVideo}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-xs rounded hover:bg-green-200 dark:hover:bg-green-800/30"
                >
                  Try Original
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Fallback indicator */}
      {useFallbackVideo && videoStatus === 'playing' && (
        <div className="absolute top-2 left-2 bg-yellow-500/80 text-white text-xs px-2 py-1 rounded z-20">
          Using sample video (format issue)
        </div>
      )}
      
      {/* Unmute button overlay */}
      {videoStatus === 'playing' && isMuted && (
        <div 
          className="absolute bottom-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full cursor-pointer z-20"
          onClick={toggleMute}
          title="Unmute"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        </div>
      )}
      
      {/* Video element */}
      {videoUrl && (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          autoPlay
          muted={isMuted}
          controls={showControls}
        />
      )}
      
      {/* Placeholder when no video */}
      {!videoUrl && videoStatus === 'idle' && !isLoading && (
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ask a question to see the avatar
          </p>
        </div>
      )}
    </div>
  );
} 