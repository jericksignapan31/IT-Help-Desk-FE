import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
    return this.http.post<Conversation>(`${this.apiUrl}/conversations`, payload).pipe(
      map(response => this.normalizeConversation(response))
    );
  }

  /**
   * Normalize conversation response to ensure ID field exists
   */
  private normalizeConversation(conv: any): Conversation {
    // Handle different ID field names from backend
    const id = conv.id || conv._id || conv.conversation_id || conv.conversationId;
    
    return {
      ...conv,
      id: id || 'unknown'
    } as Conversation;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): Observable<{ messages: Message[] }> {
    return this.http.get<unknown>(
      `${this.apiUrl}/conversations/${conversationId}/messages`
    ).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return { messages: response as Message[] };
        }

        const result = response as { messages?: unknown; data?: unknown } | null;
        const messages = Array.isArray(result?.messages)
          ? result.messages
          : Array.isArray(result?.data)
            ? result.data
            : [];

        return { messages: messages as Message[] };
      })
    );
  }

  /**
   * Load messages into state
   */
  setMessages(messages: Message[]): void {
    this.messagesSubject.next(Array.isArray(messages) ? messages : []);
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
    this.messagesSubject.next([...(Array.isArray(current) ? current : []), message]);
  }

  /**
   * Clear messages
   */
  clearMessages(): void {
    this.messagesSubject.next([]);
  }
}
