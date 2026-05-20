import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Conversation, Message } from '../models';

export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Map<string, Message[]>; // Map conversation ID to messages
  typingUsers: Map<string, string[]>; // Map conversation ID to typing user IDs
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ChatStoreService {
  private initialState: ChatState = {
    conversations: [],
    currentConversation: null,
    messages: new Map(),
    typingUsers: new Map(),
    unreadCount: 0,
    loading: false,
    error: null,
  };

  private stateSubject = new BehaviorSubject<ChatState>(this.initialState);
  state$ = this.stateSubject.asObservable();

  // Convenience observables for specific pieces of state
  conversations$ = new BehaviorSubject<Conversation[]>([]);
  currentConversation$ = new BehaviorSubject<Conversation | null>(null);
  currentMessages$ = new BehaviorSubject<Message[]>([]);
  loading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);
  unreadCount$ = new BehaviorSubject<number>(0);

  constructor() {
    this.stateSubject.subscribe((state) => {
      this.conversations$.next(state.conversations);
      this.currentConversation$.next(state.currentConversation);
      this.loading$.next(state.loading);
      this.error$.next(state.error);
      this.unreadCount$.next(state.unreadCount);

      if (state.currentConversation) {
        const messages = state.messages.get(state.currentConversation.id) || [];
        this.currentMessages$.next(messages);
      }
    });
  }

  // ============= GETTERS =============

  getState(): ChatState {
    return this.stateSubject.value;
  }

  getConversations(): Conversation[] {
    return this.getState().conversations;
  }

  getCurrentConversation(): Conversation | null {
    return this.getState().currentConversation;
  }

  getCurrentMessages(): Message[] {
    const state = this.getState();
    if (state.currentConversation) {
      return state.messages.get(state.currentConversation.id) || [];
    }
    return [];
  }

  getConversationMessages(conversationId: string): Message[] {
    return this.getState().messages.get(conversationId) || [];
  }

  getTypingUsers(conversationId: string): string[] {
    return this.getState().typingUsers.get(conversationId) || [];
  }

  getUnreadCount(): number {
    return this.getState().unreadCount;
  }

  // ============= SETTERS =============

  setConversations(conversations: Conversation[]): void {
    const state = this.getState();
    this.stateSubject.next({ ...state, conversations });
  }

  addConversation(conversation: Conversation): void {
    const state = this.getState();
    const conversations = [...state.conversations];
    const index = conversations.findIndex((c) => c.id === conversation.id);
    if (index > -1) {
      conversations[index] = conversation;
    } else {
      conversations.unshift(conversation);
    }
    this.stateSubject.next({ ...state, conversations });
  }

  setCurrentConversation(conversation: Conversation | null): void {
    const state = this.getState();
    this.stateSubject.next({ ...state, currentConversation: conversation });
  }

  setMessages(conversationId: string, messages: Message[]): void {
    const state = this.getState();
    const messagesMap = new Map(state.messages);
    messagesMap.set(conversationId, messages);
    this.stateSubject.next({ ...state, messages: messagesMap });
  }

  addMessage(conversationId: string, message: Message): void {
    const state = this.getState();
    const messagesMap = new Map(state.messages);
    const messages = messagesMap.get(conversationId) || [];
    messages.push(message);
    messagesMap.set(conversationId, messages);
    this.stateSubject.next({ ...state, messages: messagesMap });
  }

  updateMessage(conversationId: string, messageId: string, updates: Partial<Message>): void {
    const state = this.getState();
    const messages = state.messages.get(conversationId) || [];
    const index = messages.findIndex((m) => m.id === messageId);
    if (index > -1) {
      messages[index] = { ...messages[index], ...updates };
      const messagesMap = new Map(state.messages);
      messagesMap.set(conversationId, messages);
      this.stateSubject.next({ ...state, messages: messagesMap });
    }
  }

  deleteMessage(conversationId: string, messageId: string): void {
    const state = this.getState();
    const messages = (state.messages.get(conversationId) || []).filter((m) => m.id !== messageId);
    const messagesMap = new Map(state.messages);
    messagesMap.set(conversationId, messages);
    this.stateSubject.next({ ...state, messages: messagesMap });
  }

  addTypingUser(conversationId: string, userId: string): void {
    const state = this.getState();
    const typingUsers = new Map(state.typingUsers);
    const users = typingUsers.get(conversationId) || [];
    if (!users.includes(userId)) {
      users.push(userId);
    }
    typingUsers.set(conversationId, users);
    this.stateSubject.next({ ...state, typingUsers });
  }

  removeTypingUser(conversationId: string, userId: string): void {
    const state = this.getState();
    const typingUsers = new Map(state.typingUsers);
    const users = (typingUsers.get(conversationId) || []).filter((u) => u !== userId);
    if (users.length === 0) {
      typingUsers.delete(conversationId);
    } else {
      typingUsers.set(conversationId, users);
    }
    this.stateSubject.next({ ...state, typingUsers });
  }

  setUnreadCount(count: number): void {
    const state = this.getState();
    this.stateSubject.next({ ...state, unreadCount: count });
  }

  setLoading(loading: boolean): void {
    const state = this.getState();
    this.stateSubject.next({ ...state, loading });
  }

  setError(error: string | null): void {
    const state = this.getState();
    this.stateSubject.next({ ...state, error });
  }

  // ============= UTILITIES =============

  clearError(): void {
    this.setError(null);
  }

  reset(): void {
    this.stateSubject.next(this.initialState);
  }

  deleteConversation(conversationId: string): void {
    const state = this.getState();
    const conversations = state.conversations.filter((c) => c.id !== conversationId);
    const messagesMap = new Map(state.messages);
    messagesMap.delete(conversationId);

    let currentConversation = state.currentConversation;
    if (currentConversation?.id === conversationId) {
      currentConversation = null;
    }

    this.stateSubject.next({
      ...state,
      conversations,
      messages: messagesMap,
      currentConversation,
    });
  }

  updateConversation(conversation: Conversation): void {
    const state = this.getState();
    const conversations = state.conversations.map((c) => (c.id === conversation.id ? conversation : c));
    let currentConversation = state.currentConversation;
    if (currentConversation?.id === conversation.id) {
      currentConversation = conversation;
    }
    this.stateSubject.next({ ...state, conversations, currentConversation });
  }
}
