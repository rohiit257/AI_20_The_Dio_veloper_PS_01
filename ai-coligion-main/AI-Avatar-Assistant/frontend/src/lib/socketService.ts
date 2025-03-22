import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export interface SocketMessage {
  text: string;
  context?: any;
}

export interface AvatarData {
  id: string;
  status?: string;
  result_url?: string;
}

export interface AudioData {
  audioData: string;
  mimeType: string;
}

export interface TypingIndicator {
  isTyping: boolean;
}

export interface ErrorMessage {
  message: string;
  code?: number;
}

export class SocketService {
  private socket: Socket | null = null;
  public isConnected = false;
  private messageHandlers: ((data: SocketMessage) => void)[] = [];
  private audioHandlers: ((data: AudioData) => void)[] = [];
  private avatarHandlers: ((data: AvatarData) => void)[] = [];
  private typingHandlers: ((data: TypingIndicator) => void)[] = [];
  private errorHandlers: ((data: ErrorMessage) => void)[] = [];
  private statusHandlers: ((status: boolean) => void)[] = [];

  connect() {
    if (this.socket) {
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
    
    console.log('Connecting to socket server at:', socketUrl);
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'], // Allow fallback to polling if websocket fails
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.statusHandlers.forEach(handler => handler(true));
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.statusHandlers.forEach(handler => handler(false));
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      this.errorHandlers.forEach(handler => 
        handler({ message: 'Error connecting to server' })
      );
      this.statusHandlers.forEach(handler => handler(false));
    });

    this.socket.on('ai-response', (data: SocketMessage) => {
      this.messageHandlers.forEach(handler => handler(data));
    });

    this.socket.on('ai-speech', (data: AudioData) => {
      this.audioHandlers.forEach(handler => handler(data));
    });

    this.socket.on('ai-avatar', (data: AvatarData) => {
      this.avatarHandlers.forEach(handler => handler(data));
    });

    this.socket.on('ai-typing', (data: TypingIndicator) => {
      this.typingHandlers.forEach(handler => handler(data));
    });

    this.socket.on('error', (data: ErrorMessage) => {
      console.error('Socket error:', data);
      this.errorHandlers.forEach(handler => handler(data));
    });
  }

  sendMessage(message: string, options: { conversationId?: string, voice?: boolean, avatar?: boolean } = {}) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('user-message', {
      message,
      ...options
    });
  }

  onMessage(handler: (data: SocketMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onAudio(handler: (data: AudioData) => void) {
    this.audioHandlers.push(handler);
    return () => {
      this.audioHandlers = this.audioHandlers.filter(h => h !== handler);
    };
  }

  onAvatar(handler: (data: AvatarData) => void) {
    this.avatarHandlers.push(handler);
    return () => {
      this.avatarHandlers = this.avatarHandlers.filter(h => h !== handler);
    };
  }

  onTyping(handler: (data: TypingIndicator) => void) {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
    };
  }

  onError(handler: (data: ErrorMessage) => void) {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
    };
  }

  onStatusChange(handler: (status: boolean) => void) {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

// Export as singleton
export const socketService = new SocketService(); 