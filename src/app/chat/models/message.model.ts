import { Participant } from './conversation.model';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: Participant;
  text: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMessageRequest {
  conversation_id: string;
  text: string;
}

export interface MessagesResponse {
  data: Message[];
  total: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  total_unread: number;
}
