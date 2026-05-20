import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Message } from '../models';

export interface TypingIndicator {
  userId: string;
  conversationId: string;
  userName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatSocketService {
  private socket: Socket | null = null;
  private socketUrl = `${environment.apiUrl}/chat`;

  // Observable streams for real-time events
  private messageReceivedSubject = new BehaviorSubject<Message | null>(null);
  messageReceived$ = this.messageReceivedSubject.asObservable();

  private userTypingSubject = new BehaviorSubject<TypingIndicator | null>(null);
  userTyping$ = this.userTypingSubject.asObservable();

  private userStoppedTypingSubject = new BehaviorSubject<string | null>(null);
  userStoppedTyping$ = this.userStoppedTypingSubject.asObservable();

  private messageReadSubject = new BehaviorSubject<{ messageId: string; conversationId: string } | null>(null);
  messageRead$ = this.messageReadSubject.asObservable();

  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  connectionStatus$ = this.connectionStatusSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  /**
   * Initialize socket connection
   */
  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.socketUrl, {
          auth: {
            userId,
            token,
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.setupEventListeners();

        this.socket.on('connect', () => {
          this.ngZone.run(() => {
            this.connectionStatusSubject.next(true);
            console.log('Chat socket connected');
            resolve();
          });
        });

        this.socket.on('connect_error', (error) => {
          this.ngZone.run(() => {
            this.errorSubject.next(`Connection error: ${error.message}`);
            console.error('Socket connection error:', error);
            reject(error);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connectionStatusSubject.next(false);
      this.socket = null;
    }
  }

  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', () => {
      this.ngZone.run(() => {
        this.connectionStatusSubject.next(false);
        console.log('Chat socket disconnected');
      });
    });

    // Message events
    this.socket.on('message_received', (data: Message) => {
      this.ngZone.run(() => {
        this.messageReceivedSubject.next(data);
      });
    });

    // Typing events
    this.socket.on('user_typing', (data: TypingIndicator) => {
      this.ngZone.run(() => {
        this.userTypingSubject.next(data);
      });
    });

    this.socket.on('user_stopped_typing', (data: { userId: string }) => {
      this.ngZone.run(() => {
        this.userStoppedTypingSubject.next(data.userId);
      });
    });

    // Read receipt events
    this.socket.on('message_read', (data: { messageId: string; conversationId: string }) => {
      this.ngZone.run(() => {
        this.messageReadSubject.next(data);
      });
    });

    // Error events
    this.socket.on('error', (data: { message: string }) => {
      this.ngZone.run(() => {
        this.errorSubject.next(data.message);
        console.error('Chat socket error:', data.message);
      });
    });
  }

  /**
   * Join a conversation
   */
  joinConversation(conversationId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('join_conversation', { conversationId });
  }

  /**
   * Leave a conversation
   */
  leaveConversation(conversationId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('leave_conversation', { conversationId });
  }

  /**
   * Send message in real-time
   */
  sendMessage(conversationId: string, text: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('send_message', {
      conversationId,
      text,
    });
  }

  /**
   * Emit typing indicator
   */
  emitTyping(conversationId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('typing', { conversationId });
  }

  /**
   * Emit stop typing
   */
  emitStopTyping(conversationId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('stop_typing', { conversationId });
  }

  /**
   * Mark message as read
   */
  markAsRead(messageId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('mark_as_read', { messageId });
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
