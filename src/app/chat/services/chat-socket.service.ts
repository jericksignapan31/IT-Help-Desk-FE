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

  // Track typing users per conversation
  private typingUsersSubject = new BehaviorSubject<Map<string, Set<string>>>(new Map());
  typingUsers$ = this.typingUsersSubject.asObservable();

  // Track online users
  private onlineUsersSubject = new BehaviorSubject<Set<string>>(new Set());
  onlineUsers$ = this.onlineUsersSubject.asObservable();

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

        this.socket.on('connect_error', (error: Error) => {
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
        console.log('[ChatSocket] Disconnected from server');
      });
    });

    this.socket.on('connect_error', (error: any) => {
      this.ngZone.run(() => {
        const errorMsg = `Connection error: ${error?.message || 'Unknown error'}`;
        this.errorSubject.next(errorMsg);
        console.error('[ChatSocket] Connection error:', error);
      });
    });

    // Message events
    this.socket.on('new_message', (data: Message) => {
      this.ngZone.run(() => {
        console.log('[ChatSocket] Message received:', data);
        this.messageReceivedSubject.next(data);
      });
    });

    // Typing events
    this.socket.on('user_typing', (data: any) => {
      this.ngZone.run(() => {
        const typingData: TypingIndicator = {
          userId: data.userId,
          conversationId: data.conversationId || data.conversation_id,
          userName: data.userName || data.user_name,
        };
        console.log('[ChatSocket] User typing:', typingData);
        this.addTypingUser(typingData.conversationId, typingData.userId);
        this.userTypingSubject.next(typingData);
      });
    });

    this.socket.on('user_stopped_typing', (data: { userId: string; conversationId: string }) => {
      this.ngZone.run(() => {
        console.log('[ChatSocket] User stopped typing:', data.userId);
        this.removeTypingUser(data.conversationId, data.userId);
        this.userStoppedTypingSubject.next(data.userId);
      });
    });

    this.socket.on('user_joined', (data: any) => {
      this.ngZone.run(() => {
        console.log('[ChatSocket] User joined conversation:', data);
        this.addOnlineUser(data.userId);
      });
    });

    this.socket.on('user_left', (data: any) => {
      this.ngZone.run(() => {
        console.log('[ChatSocket] User left conversation:', data);
        this.removeOnlineUser(data.userId);
      });
    });

    this.socket.on('user_online', (data: { userId: string }) => {
      this.ngZone.run(() => {
        console.log('[ChatSocket] User online:', data.userId);
        this.addOnlineUser(data.userId);
      });
    });

    this.socket.on('user_offline', (data: { userId: string }) => {
      this.ngZone.run(() => {
        console.log('[ChatSocket] User offline:', data.userId);
        this.removeOnlineUser(data.userId);
      });
    });

    // Read receipt events
    this.socket.on('message_read', (data: { messageId: string; conversationId: string }) => {
      this.ngZone.run(() => {
        console.log('[ChatSocket] Message marked as read:', data);
        this.messageReadSubject.next(data);
      });
    });

    // Error events
    this.socket.on('error', (data: { message: string }) => {
      this.ngZone.run(() => {
        console.error('[ChatSocket] Server error:', data.message);
        this.errorSubject.next(data.message);
      });
    });

    console.log('[ChatSocket] Event listeners setup complete');
  }

  /**
   * Join a conversation (subscribe to room)
   */
  joinConversation(conversationId: string): void {
    if (!this.socket) {
      console.warn('[ChatSocket] Socket not connected, cannot join conversation');
      return;
    }
    console.log('[ChatSocket] Joining conversation:', conversationId);
    this.socket.emit('join_conversation', { conversationId });
  }

  /**
   * Leave a conversation (unsubscribe from room)
   */
  leaveConversation(conversationId: string): void {
    if (!this.socket) {
      console.warn('[ChatSocket] Socket not connected, cannot leave conversation');
      return;
    }
    console.log('[ChatSocket] Leaving conversation:', conversationId);
    this.socket.emit('leave_conversation', { conversationId });
  }

  /**
   * Send message through Socket.io (for real-time updates)
   * Note: Messages are typically sent via HTTP API, Socket.io is used for broadcast
   */
  sendMessage(conversationId: string, content: string): void {
    if (!this.socket) {
      console.warn('[ChatSocket] Socket not connected, cannot send message');
      return;
    }
    console.log('[ChatSocket] Sending message to conversation:', conversationId);
    this.socket.emit('send_message', {
      conversation_id: conversationId,
      content,
    });
  }

  /**
   * Emit typing indicator
   */
  emitTyping(conversationId: string): void {
    if (!this.socket) {
      console.warn('[ChatSocket] Socket not connected, cannot emit typing');
      return;
    }
    this.socket.emit('typing', {
      conversationId,
      isTyping: true,
    });
  }

  /**
   * Emit stop typing
   */
  emitStopTyping(conversationId: string): void {
    if (!this.socket) {
      console.warn('[ChatSocket] Socket not connected, cannot emit stop typing');
      return;
    }
    this.socket.emit('typing', {
      conversationId,
      isTyping: false,
    });
  }

  /**
   * Mark message as read
   */
  markAsRead(messageId: string): void {
    if (!this.socket) {
      console.warn('[ChatSocket] Socket not connected, cannot mark as read');
      return;
    }
    console.log('[ChatSocket] Marking message as read:', messageId);
    this.socket.emit('mark_as_read', { messageId });
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get typing users for a specific conversation
   */
  getTypingUsersForConversation(conversationId: string): string[] {
    const allTypingUsers = this.typingUsersSubject.value;
    const typingInConversation = allTypingUsers.get(conversationId);
    return typingInConversation ? Array.from(typingInConversation) : [];
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsersSubject.value);
  }

  /**
   * Add typing user to conversation
   */
  private addTypingUser(conversationId: string, userId: string): void {
    const allTypingUsers = new Map(this.typingUsersSubject.value);
    if (!allTypingUsers.has(conversationId)) {
      allTypingUsers.set(conversationId, new Set());
    }
    allTypingUsers.get(conversationId)!.add(userId);
    this.typingUsersSubject.next(allTypingUsers);
  }

  /**
   * Remove typing user from conversation
   */
  private removeTypingUser(conversationId: string, userId: string): void {
    const allTypingUsers = new Map(this.typingUsersSubject.value);
    if (allTypingUsers.has(conversationId)) {
      allTypingUsers.get(conversationId)!.delete(userId);
      if (allTypingUsers.get(conversationId)!.size === 0) {
        allTypingUsers.delete(conversationId);
      }
    }
    this.typingUsersSubject.next(allTypingUsers);
  }

  /**
   * Add online user
   */
  private addOnlineUser(userId: string): void {
    const onlineUsers = new Set(this.onlineUsersSubject.value);
    onlineUsers.add(userId);
    this.onlineUsersSubject.next(onlineUsers);
  }

  /**
   * Remove online user
   */
  private removeOnlineUser(userId: string): void {
    const onlineUsers = new Set(this.onlineUsersSubject.value);
    onlineUsers.delete(userId);
    this.onlineUsersSubject.next(onlineUsers);
  }
}
