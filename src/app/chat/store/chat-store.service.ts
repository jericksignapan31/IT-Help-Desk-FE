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
        const messages = state.messages.get(state.currentConversation.conversation_id);
        // Only update if messages exist OR if we have a current conversation
        // This prevents emitting empty array when switching conversations
        if (messages !== undefined) {
          this.currentMessages$.next(messages);
        }
        console.log('📦 Store updated for conversation:', {
          conversationId: state.currentConversation.conversation_id,
          messageCount: messages?.length || 0,
        });
      } else {
        // Clear messages only when explicitly setting to null
        this.currentMessages$.next([]);
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
      return state.messages.get(state.currentConversation.conversation_id) || [];
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
    const messagesMap = new Map(state.messages);
    
    // Extract and cache messages from each conversation
    conversations.forEach((conv) => {
      if (conv.messages && conv.messages.length > 0) {
        messagesMap.set(conv.conversation_id, conv.messages);
        console.log(`💾 Cached ${conv.messages.length} messages for conversation ${conv.conversation_id}`);
      }
    });
    
    this.stateSubject.next({ ...state, conversations, messages: messagesMap });
  }

  addConversation(conversation: Conversation): void {
    const state = this.getState();
    const conversations = [...state.conversations];
    const index = conversations.findIndex((c) => c.conversation_id === conversation.conversation_id);
    
    if (index > -1) {
      conversations[index] = conversation;
    } else {
      conversations.unshift(conversation);
    }
    
    // Cache messages if included
    const messagesMap = new Map(state.messages);
    if (conversation.messages && conversation.messages.length > 0) {
      messagesMap.set(conversation.conversation_id, conversation.messages);
      console.log(`💾 Cached ${conversation.messages.length} messages for conversation ${conversation.conversation_id}`);
    }
    
    this.stateSubject.next({ ...state, conversations, messages: messagesMap });
  }

  setCurrentConversation(conversation: Conversation | null): void {
    if (conversation) {
      console.log('📦 Storing current conversation:', { id: conversation.conversation_id, type: conversation.type, name: conversation.name });
    } else {
      console.log('📦 Clearing current conversation');
    }
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
    const existingMessages = messagesMap.get(conversationId) || [];
    const messages = [...existingMessages, message]; // Create NEW array with message
    messagesMap.set(conversationId, messages);
    this.stateSubject.next({ ...state, messages: messagesMap });
    console.log('📦 Message added to store:', {
      conversationId,
      messageId: (message as any).message_id,
      totalMessages: messages.length,
    });
  }

  updateMessage(conversationId: string, messageId: string, updates: Partial<Message>): void {
    const state = this.getState();
    const existingMessages = state.messages.get(conversationId) || [];
    // Look for both 'id' and 'message_id' field names to be safe
    const index = existingMessages.findIndex((m) => (m as any).message_id === messageId || (m as any).id === messageId);
    if (index > -1) {
      const messages = [...existingMessages]; // Create NEW array
      messages[index] = { ...messages[index], ...updates }; // Update copy
      const messagesMap = new Map(state.messages);
      messagesMap.set(conversationId, messages);
      this.stateSubject.next({ ...state, messages: messagesMap });
      console.log('📦 Message updated:', { conversationId, messageId, updates });
    } else {
      console.warn('Message not found for update:', { conversationId, messageId });
    }
  }

  deleteMessage(conversationId: string, messageId: string): void {
    const state = this.getState();
    const messages = (state.messages.get(conversationId) || []).filter(
      (m) => (m as any).message_id !== messageId && (m as any).id !== messageId
    );
    const messagesMap = new Map(state.messages);
    messagesMap.set(conversationId, messages);
    this.stateSubject.next({ ...state, messages: messagesMap });
    console.log('📦 Message deleted:', { conversationId, messageId });
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
    const conversations = state.conversations.filter((c) => c.conversation_id !== conversationId);
    const messagesMap = new Map(state.messages);
    messagesMap.delete(conversationId);

    let currentConversation = state.currentConversation;
    if (currentConversation?.conversation_id === conversationId) {
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
    const conversations = state.conversations.map((c) => (c.conversation_id === conversation.conversation_id ? conversation : c));
    let currentConversation = state.currentConversation;
    if (currentConversation?.conversation_id === conversation.conversation_id) {
      currentConversation = conversation;
    }
    this.stateSubject.next({ ...state, conversations, currentConversation });
  }
}
