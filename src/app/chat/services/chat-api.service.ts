import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Conversation,
  ConversationsResponse,
  CreateConversationRequest,
  Message,
  MessagesResponse,
  CreateMessageRequest,
  UnreadCountResponse,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class ChatApiService {
  private apiUrl = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  // ============= CONVERSATION ENDPOINTS =============

  /**
   * Get all conversations with pagination
   */
  getConversations(page: number = 1, limit: number = 20): Observable<ConversationsResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http.get<ConversationsResponse>(`${this.apiUrl}/conversations`, { params });
  }

  /**
   * Get specific conversation by ID
   */
  getConversation(conversationId: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.apiUrl}/conversations/${conversationId}`);
  }

  /**
   * Create a new conversation
   */
  createConversation(request: CreateConversationRequest): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.apiUrl}/conversations`, request);
  }

  /**
   * Update conversation (name, etc.)
   */
  updateConversation(conversationId: string, data: Partial<Conversation>): Observable<Conversation> {
    return this.http.put<Conversation>(`${this.apiUrl}/conversations/${conversationId}`, data);
  }

  /**
   * Delete conversation
   */
  deleteConversation(conversationId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/conversations/${conversationId}`);
  }

  // ============= MESSAGE ENDPOINTS =============

  /**
   * Send a message
   */
  sendMessage(request: CreateMessageRequest): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/messages`, request);
  }

  /**
   * Get messages for a conversation (paginated)
   */
  getMessages(conversationId: string, page: number = 1, limit: number = 50): Observable<MessagesResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http.get<MessagesResponse>(`${this.apiUrl}/conversations/${conversationId}/messages`, { params });
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(messageId: string): Observable<Message> {
    return this.http.put<Message>(`${this.apiUrl}/messages/${messageId}`, { is_read: true });
  }

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/messages/${messageId}`);
  }

  // ============= STATUS ENDPOINTS =============

  /**
   * Get total unread message count
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`);
  }

  /**
   * Get unread count for specific conversation
   */
  getConversationUnreadCount(conversationId: string): Observable<{ unread_count: number }> {
    return this.http.get<{ unread_count: number }>(`${this.apiUrl}/conversations/${conversationId}/unread`);
  }
}
