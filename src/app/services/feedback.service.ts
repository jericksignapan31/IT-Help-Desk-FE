import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatFeedback } from '../models/chat.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private apiUrl = `${environment.apiUrl}/chat/chatbot`;

  constructor(private http: HttpClient) {}

  /**
   * Submit feedback for a chatbot response
   */
  submitFeedback(feedback: {
    interaction_id: string;
    satisfaction_score: number;
    is_helpful: boolean;
    user_feedback: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/feedback`, feedback);
  }
}
