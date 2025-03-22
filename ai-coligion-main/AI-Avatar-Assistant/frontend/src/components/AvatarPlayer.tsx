import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from '../styles/AvatarPlayer.module.css';
import { apiService } from '../lib/apiService';

interface AvatarPlayerProps {
  videoUrl?: string;
  isLoading?: boolean;
  audioUrl?: string;
  avatarId?: string;
  onAvatarReady?: (url: string) => void;
}

// Local fallback resources - ensure these are in the public directory
const FALLBACK_IMAGE_URL = '/assets/images/avatar-static.png';
const FALLBACK_VIDEO_URL = '/assets/videos/default-avatar.mp4';
const SILENT_AUDIO_URL = '/assets/audio/silent.mp3';

const AvatarPlayer: React.FC<AvatarPlayerProps> = ({ 
  videoUrl, 
  isLoading = false,
  audioUrl,
  avatarId,
  onAvatarReady
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<boolean>(false);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | undefined>(videoUrl);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | undefined>(audioUrl);
  const [pollingTimer, setPollingTimer] = useState<NodeJS.Timeout | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState<number>(0);
  const MAX_POLLING_ATTEMPTS = 15; // Maximum number of polling attempts
  const pollingAttemptsRef = useRef<number>(0);

  // Reset video error when url changes
  useEffect(() => {
    if (videoUrl) {
      setVideoError(false);
      setLocalVideoUrl(videoUrl);
    }
  }, [videoUrl]);

  // Update local audio URL when audio URL changes
  useEffect(() => {
    if (audioUrl) {
      setAudioError(false);
      setLocalAudioUrl(audioUrl);
    }
  }, [audioUrl]);

  // Helper function to check if a URL is valid
  const isValidUrl = (url?: string): boolean => {
    if (!url) return false;
    // Consider local asset paths as valid
    if (url.startsWith('/assets/')) return true;
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Check if URL is a remote URL (not a local asset)
  const isRemoteUrl = (url?: string): boolean => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Clear polling timer helper (extracted to avoid dependency issues)
  const clearPollingTimer = useCallback(() => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      setPollingTimer(null);
    }
  }, [pollingTimer]);

  // Handle avatar ID polling
  useEffect(() => {
    // Reset polling attempts when avatarId changes
    if (avatarId) {
      pollingAttemptsRef.current = 0;
      setPollingAttempts(0);
      setVideoError(false);
    }

    if (avatarId && !localVideoUrl) {
      // Start polling for avatar status
      const startPolling = async () => {
        try {
          // Use ref to track attempts to avoid dependency cycle
          pollingAttemptsRef.current += 1;
          setPollingAttempts(pollingAttemptsRef.current);
          
          if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
            console.log('Max polling attempts reached, using fallback video');
            setLocalVideoUrl(FALLBACK_VIDEO_URL);
            if (onAvatarReady) {
              onAvatarReady(FALLBACK_VIDEO_URL);
            }
            clearPollingTimer();
            return;
          }

          const status = await apiService.getAvatarStatus(avatarId);
          
          if (status.status === 'done' && status.result_url) {
            // If result URL is external and not starting with http, add protocol
            let finalUrl = status.result_url;
            if (!finalUrl.startsWith('/') && !finalUrl.startsWith('http')) {
              finalUrl = 'https://' + finalUrl;
            }
            
            // For external URLs that might fail, use local fallback
            if (isRemoteUrl(finalUrl)) {
              // Just use local fallback directly for this demo
              console.log('Using local fallback instead of external URL:', finalUrl);
              finalUrl = FALLBACK_VIDEO_URL;
            }
            
            // Avatar is ready
            setLocalVideoUrl(finalUrl);
            if (onAvatarReady) {
              onAvatarReady(finalUrl);
            }
            
            // Clear polling timer
            clearPollingTimer();
          } else if (status.status === 'error') {
            // Avatar generation failed, use fallback
            console.error('Avatar generation failed, using fallback video');
            setLocalVideoUrl(FALLBACK_VIDEO_URL);
            if (onAvatarReady) {
              onAvatarReady(FALLBACK_VIDEO_URL);
            }
            clearPollingTimer();
          }
          // Continue polling for 'created' or 'processing' statuses
        } catch (error) {
          console.error('Error polling avatar status:', error);
          
          // After multiple failures, use fallback
          if (pollingAttemptsRef.current >= 5) {
            console.log('Multiple polling failures, using fallback video');
            setLocalVideoUrl(FALLBACK_VIDEO_URL);
            if (onAvatarReady) {
              onAvatarReady(FALLBACK_VIDEO_URL);
            }
            clearPollingTimer();
          }
        }
      };

      // Clear any existing timer
      clearPollingTimer();

      // Start immediate check
      startPolling();
      
      // Set up interval for checking (every 2 seconds)
      const timer = setInterval(startPolling, 2000);
      setPollingTimer(timer);
      
      return () => {
        clearPollingTimer();
      };
    }
    
    return () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
    };
  }, [avatarId, localVideoUrl, onAvatarReady, clearPollingTimer]);

  // Play audio when available
  useEffect(() => {
    if (localAudioUrl && audioRef.current) {
      const playAudio = async () => {
        try {
          await audioRef.current!.play();
        } catch (err) {
          console.error('Error playing audio:', err);
          setAudioError(true);
          
          // Try playing the silent audio as a fallback
          if (localAudioUrl !== SILENT_AUDIO_URL) {
            setLocalAudioUrl(SILENT_AUDIO_URL);
          }
        }
      };
      
      playAudio();
    }
  }, [localAudioUrl]);

  const handleVideoError = () => {
    console.error('Error loading video from:', localVideoUrl);
    
    // Always fall back to the local video regardless of source
    if (localVideoUrl !== FALLBACK_VIDEO_URL) {
      console.log('Video failed to load, using local fallback');
      setLocalVideoUrl(FALLBACK_VIDEO_URL);
    } else {
      // Even the fallback failed
      setVideoError(true);
    }
  };

  const handleAudioError = () => {
    console.error('Error playing audio from:', localAudioUrl);
    setAudioError(true);
    
    // Switch to silent audio if not already using it
    if (localAudioUrl !== SILENT_AUDIO_URL) {
      setLocalAudioUrl(SILENT_AUDIO_URL);
    }
  };

  const handleVideoEnded = () => {
    // Reset video to first frame when done
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className={styles.avatarContainer}>
      {isLoading || (avatarId && !localVideoUrl && !videoError) ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <span>Generating avatar response... {pollingAttempts > 0 ? `(${pollingAttempts}/${MAX_POLLING_ATTEMPTS})` : ''}</span>
        </div>
      ) : isValidUrl(localVideoUrl) && !videoError ? (
        <video 
          ref={videoRef}
          className={styles.avatarVideo}
          src={localVideoUrl}
          autoPlay
          playsInline
          controls
          onError={handleVideoError}
          onEnded={handleVideoEnded}
        />
      ) : (
        <div className={styles.avatarPlaceholder}>
          <p>AI Assistant</p>
          {videoError && <p className={styles.errorText}>Unable to load avatar</p>}
        </div>
      )}

      {localAudioUrl && (
        <audio 
          ref={audioRef} 
          src={localAudioUrl} 
          className={styles.hiddenAudio}
          onError={handleAudioError}
        />
      )}
    </div>
  );
};

export default AvatarPlayer; 