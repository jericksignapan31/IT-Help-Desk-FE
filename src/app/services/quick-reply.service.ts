import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface QuickReply {
  id: string;
  text: string;
  icon: string;
  category: 'help' | 'report' | 'check' | 'other';
}

@Injectable({
  providedIn: 'root',
})
export class QuickReplyService {
  private quickReplies: QuickReply[] = [
    {
      id: 'help-1',
      text: 'How do I reset my password?',
      icon: 'lock_reset',
      category: 'help',
    },
    {
      id: 'help-2',
      text: 'I need technical support',
      icon: 'support_agent',
      category: 'help',
    },
    {
      id: 'report-1',
      text: 'Report a system issue',
      icon: 'bug_report',
      category: 'report',
    },
    {
      id: 'report-2',
      text: 'Request IT maintenance',
      icon: 'construction',
      category: 'report',
    },
    {
      id: 'check-1',
      text: 'Check ticket status',
      icon: 'assignment',
      category: 'check',
    },
    {
      id: 'check-2',
      text: 'View FAQ',
      icon: 'help',
      category: 'check',
    },
  ];

  private suggestedMessagesSubject = new BehaviorSubject<string[]>([]);
  public suggestedMessages$ = this.suggestedMessagesSubject.asObservable();

  constructor() {}

  /**
   * Get quick reply buttons
   */
  getQuickReplies(): QuickReply[] {
    return this.quickReplies;
  }

  /**
   * Get quick replies by category
   */
  getQuickRepliesByCategory(category: string): QuickReply[] {
    return this.quickReplies.filter((reply) => reply.category === category);
  }

  /**
   * Set suggested messages based on conversation context
   */
  setSuggestedMessages(suggestions: string[]): void {
    this.suggestedMessagesSubject.next(suggestions);
  }

  /**
   * Get current suggested messages
   */
  getSuggestedMessages(): Observable<string[]> {
    return this.suggestedMessagesSubject.asObservable();
  }

  /**
   * Clear suggested messages
   */
  clearSuggestedMessages(): void {
    this.suggestedMessagesSubject.next([]);
  }
}
