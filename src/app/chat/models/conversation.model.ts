export type ConversationType = 'DIRECT' | 'TICKET' | 'GROUP';

export interface Participant {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  avatar?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  participant_ids: string[];
  participants?: Participant[];
  name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateConversationRequest {
  type: ConversationType;
  participant_ids: string[];
  name?: string;
}

export interface ConversationsResponse {
  data: Conversation[];
  total: number;
  page: number;
  limit: number;
}
