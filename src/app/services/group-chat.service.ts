import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, map } from 'rxjs/operators';

export interface ChatMessage {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender: {
    employee_id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  conversation_id: string;
  type: 'GROUP' | 'DIRECT' | 'TICKET';
  name: string;
  participant_ids: string[];
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroupChatService {
  private apiUrl = `${environment.apiUrl}/chat`;
  private conversations$ = new BehaviorSubject<Conversation[]>([]);
  private currentConversation$ = new BehaviorSubject<Conversation | null>(null);
  private messages$ = new BehaviorSubject<ChatMessage[]>([]);

  // Mock general chat for testing
  private mockGeneralChat: Conversation = {
    conversation_id: 'general-chat-001',
    type: 'GROUP',
    name: 'General Chat',
    participant_ids: [],
    messages: [
      {
        message_id: 'msg-001',
        conversation_id: 'general-chat-001',
        sender_id: 'EMP001',
        sender: {
          employee_id: 'EMP001',
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@ithelp.com'
        },
        content: 'Welcome to the General Chat! Feel free to discuss anything here.',
        is_read: true,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        message_id: 'msg-002',
        conversation_id: 'general-chat-001',
        sender_id: 'EMP002',
        sender: {
          employee_id: 'EMP002',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@ithelp.com'
        },
        content: 'Thanks! Excited to be part of this community.',
        is_read: true,
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString()
  };

  constructor(private http: HttpClient) {}

  // Get all conversations with messages
  getAllConversations(): Observable<Conversation[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all-conversations-with-messages`).pipe(
      catchError(err => {
        console.warn('getAllConversations failed, using mock data:', err);
        return of([this.mockGeneralChat]);
      })
    );
  }

  // Load all conversations and cache them
  loadConversations(): Observable<Conversation[]> {
    return new Observable(observer => {
      this.getAllConversations().subscribe({
        next: (conversations) => {
          this.conversations$.next(conversations);
          observer.next(conversations);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  // Get conversations from cache
  getConversationsFromCache(): Observable<Conversation[]> {
    return this.conversations$.asObservable();
  }

  // Send a message
  sendMessage(conversationId: string, content: string): Observable<ChatMessage> {
    const mockMessage: ChatMessage = {
      message_id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: 'current-user-' + Math.random().toString(36).substr(2, 9),
      sender: {
        employee_id: 'current-user',
        first_name: 'You',
        last_name: 'User',
        email: 'current@ithelp.com'
      },
      content: content,
      is_read: false,
      created_at: new Date().toISOString()
    };

    return this.http.post<ChatMessage>(`${this.apiUrl}/messages`, {
      conversation_id: conversationId,
      content
    }).pipe(
      catchError(err => {
        console.warn('sendMessage API failed, using local message:', err);
        return of(mockMessage);
      })
    );
  }

  // Set current conversation
  setCurrentConversation(conversation: Conversation): void {
    this.currentConversation$.next(conversation);
    this.messages$.next(conversation.messages || []);
  }

  // Get current conversation
  getCurrentConversation(): Observable<Conversation | null> {
    return this.currentConversation$.asObservable();
  }

  // Get messages from current conversation
  getMessages(): Observable<ChatMessage[]> {
    return this.messages$.asObservable();
  }

  // Add message to cache
  addMessage(message: ChatMessage): void {
    const currentMessages = this.messages$.value;
    this.messages$.next([...currentMessages, message]);

    const conversations = this.conversations$.value;
    const updatedConversations = conversations.map(conv => {
      if (conv.conversation_id === message.conversation_id) {
        return {
          ...conv,
          messages: [...(conv.messages || []), message],
          updated_at: new Date().toISOString()
        };
      }
      return conv;
    });
    this.conversations$.next(updatedConversations);
  }

  // Get general group chat
  getGeneralChat(): Observable<Conversation | any> {
    // Try /general endpoint first
    return this.http.get<any>(`${this.apiUrl}/general`).pipe(
      catchError(err => {
        console.warn('getGeneralChat /general endpoint failed, trying /all-conversations-with-messages:', err);
        // Fallback to getting all conversations and filtering for General
        return this.http.get<any[]>(`${this.apiUrl}/all-conversations-with-messages`).pipe(
          map(conversations => {
            // Find the General chat conversation
            const generalChat = conversations.find(c => c.type === 'GROUP' && (c.name === 'General' || c.name.includes('General')));
            if (generalChat) {
              return generalChat;
            }
            // If no General chat found, return first GROUP type or mock data
            return conversations.find(c => c.type === 'GROUP') || JSON.parse(JSON.stringify(this.mockGeneralChat));
          }),
          catchError(err2 => {
            console.warn('getAllConversations also failed, using mock data:', err2);
            return of(JSON.parse(JSON.stringify(this.mockGeneralChat)));
          })
        );
      })
    );
  }

  // Transform backend response to match frontend interface
  private transformConversation(conv: any): Conversation {
    return {
      conversation_id: conv.conversation_id,
      type: conv.type,
      name: conv.name,
      participant_ids: conv.participant_ids || [],
      messages: (conv.messages || []).map((msg: any) => this.transformMessage(msg)),
      created_at: conv.created_at,
      updated_at: conv.updated_at
    };
  }

  private transformMessage(msg: any): ChatMessage {
    // Handle backend sender format
    const sender = msg.sender || {};
    return {
      message_id: msg.message_id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      sender: {
        employee_id: sender.employee_id || sender.user_id || '',
        first_name: sender.first_name || sender.username || 'User',
        last_name: sender.last_name || '',
        email: sender.email || sender.username || ''
      },
      content: msg.content,
      is_read: msg.is_read || false,
      created_at: msg.created_at
    };
  }

  // Create group conversation
  createGroupConversation(name: string, participantIds: string[]): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.apiUrl}/conversations`, {
      type: 'GROUP',
      name,
      participant_ids: participantIds
    });
  }

  // Get specific conversation messages
  getConversationMessages(conversationId: string, limit: number = 50, offset: number = 0): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${this.apiUrl}/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`
    );
  }
}
