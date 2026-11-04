import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Conversation, Message, ChatbotResponse } from '../models/chat.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;

  // Observable streams
  private conversationSubject = new BehaviorSubject<Conversation | null>(null);
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public conversation$ = this.conversationSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Create or get conversation
   */
  startConversation(): Observable<Conversation> {
    // Send required payload for backend
    const payload = {
      type: 'DIRECT',
      name: 'Chatbot Support Chat'
    };
    return this.http.post<Conversation>(`${this.apiUrl}/conversations`, payload);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): Observable<{ messages: Message[] }> {
    return this.http.get<{ messages: Message[] }>(
      `${this.apiUrl}/conversations/${conversationId}/messages`
    );
  }

  /**
   * Load messages into state
   */
  setMessages(messages: Message[]): void {
    this.messagesSubject.next(messages);
  }

  /**
   * Get current messages
   */
  getMessages(): Message[] {
    return this.messagesSubject.value;
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Set error
   */
  setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  /**
   * Add message to local state (optimistic update)
   */
  addMessage(message: Message): void {
    const current = this.messagesSubject.value;
    this.messagesSubject.next([...current, message]);
  }

  /**
   * Clear messages
   */
  clearMessages(): void {
    this.messagesSubject.next([]);
  }
}
