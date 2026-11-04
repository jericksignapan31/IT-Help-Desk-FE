import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { ChatService } from './chat.service';
import { ChatbotService } from './chatbot.service';
import { Message } from '../models/chat.model';

export interface MessageSendResult {
  userMessage: Message;
  botMessage: Message;
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MessageSendingService {
  private isSendingSubject = new BehaviorSubject<boolean>(false);
  public isSending$ = this.isSendingSubject.asObservable();

  constructor(
    private chatService: ChatService,
    private chatbotService: ChatbotService,
  ) {}

  /**
   * Send message and get AI response
   * @param conversationId - ID of the conversation
   * @param messageText - User message text
   * @returns Observable with both user and bot messages
   */
  sendMessageAndGetResponse(
    conversationId: string,
    messageText: string,
  ): Observable<MessageSendResult> {
    return new Observable((observer) => {
      if (!messageText.trim() || this.isSendingSubject.value) {
        observer.error('Invalid message or already sending');
        return;
      }

      // Create user message
      const userMsg: Message = {
        id: uuidv4(),
        conversationId,
        type: 'user',
        content: messageText,
        timestamp: new Date(),
      };

      // Add user message immediately
      this.chatService.addMessage(userMsg);
      this.isSendingSubject.next(true);
      this.chatService.setLoading(true);
      this.chatService.setError(null);

      // Send to chatbot
      this.chatbotService.sendMessage(conversationId, messageText).subscribe({
        next: (response) => {
          // Create bot response message
          const botMsg: Message = {
            id: uuidv4(),
            conversationId,
            type: 'assistant',
            content: response.response,
            timestamp: new Date(),
            confidence: response.confidence,
            interactionId: response.interactionId,
            metadata: {
              intent: response.intent,
              responseType: response.responseType,
              suggestedActions: response.suggestedActions,
            },
          };

          // Add bot message
          this.chatService.addMessage(botMsg);
          this.chatbotService.updateLastIntent(response.intent, response.confidence);

          // Emit success result
          observer.next({
            userMessage: userMsg,
            botMessage: botMsg,
            success: true,
          });

          this.isSendingSubject.next(false);
          this.chatService.setLoading(false);
          observer.complete();
        },
        error: (err) => {
          console.error('Failed to send message:', err);
          const errorMsg = 'Failed to get response. Please try again.';
          this.chatService.setError(errorMsg);
          this.isSendingSubject.next(false);
          this.chatService.setLoading(false);

          observer.next({
            userMessage: userMsg,
            botMessage: {} as Message,
            success: false,
            error: errorMsg,
          });

          observer.complete();
        },
      });
    });
  }

  /**
   * Quick send without waiting for response (for UI purposes)
   * @param conversationId - ID of the conversation
   * @param messageText - User message text
   */
  quickSendMessage(conversationId: string, messageText: string): void {
    if (!messageText.trim() || this.isSendingSubject.value) return;

    const userMsg: Message = {
      id: uuidv4(),
      conversationId,
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    this.chatService.addMessage(userMsg);
    this.isSendingSubject.next(true);
    this.chatService.setLoading(true);

    this.chatbotService.sendMessage(conversationId, messageText).subscribe({
      next: () => {
        this.isSendingSubject.next(false);
        this.chatService.setLoading(false);
      },
      error: () => {
        this.isSendingSubject.next(false);
        this.chatService.setLoading(false);
      },
    });
  }

  /**
   * Get current sending state
   */
  isSending(): boolean {
    return this.isSendingSubject.value;
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.chatService.setError(null);
  }
}
