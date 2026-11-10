import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatbotResponse, ChatbotStats } from '../models/chat.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private apiUrl = `${environment.apiUrl}/chat`;

  // State
  private statsSubject = new BehaviorSubject<ChatbotStats | null>(null);
  private lastIntentSubject = new BehaviorSubject<string>('');
  private lastConfidenceSubject = new BehaviorSubject<number>(0);

  public stats$ = this.statsSubject.asObservable();
  public lastIntent$ = this.lastIntentSubject.asObservable();
  public lastConfidence$ = this.lastConfidenceSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStats();
  }

  /**
   * Send message to chatbot and get response
   */
  sendMessage(conversationId: string, message: string): Observable<ChatbotResponse> {
    return this.http.post<ChatbotResponse>(
      `${this.apiUrl}/chatbot/message`,
      { conversation_id: conversationId, message }
    );
  }

  /**
   * Load chatbot statistics with fallback
   */
  loadStats(): void {
    this.http.get<ChatbotStats>(`${this.apiUrl}/chatbot/stats`).subscribe({
      next: (stats) => {
        console.log('✅ Chatbot stats loaded:', stats);
        this.statsSubject.next(stats);
      },
      error: (err) => {
        console.error('❌ Failed to load chatbot stats:', err);
        // Use default stats on error
        const defaultStats: ChatbotStats = {
          totalInteractions: 0,
          averageConfidence: 0,
          userSatisfaction: 0,
          totalKBEntries: 0,
          totalTicketsCreated: 0,
          avgResolutionTime: 'N/A',
        };
        this.statsSubject.next(defaultStats);
      },
    });
  }

  /**
   * Update last intent and confidence
   */
  updateLastIntent(intent: string, confidence: number): void {
    this.lastIntentSubject.next(intent);
    this.lastConfidenceSubject.next(confidence);
  }

  /**
   * Get current stats
   */
  getStats(): ChatbotStats | null {
    return this.statsSubject.value;
  }

  /**
   * Get last intent
   */
  getLastIntent(): string {
    return this.lastIntentSubject.value;
  }

  /**
   * Get last confidence
   */
  getLastConfidence(): number {
    return this.lastConfidenceSubject.value;
  }
}
