import { Participant } from './conversation.model';

export interface FileAttachment {
  id?: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  preview_url?: string; // For images
  uploaded_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: Participant;
  content: string;
  is_read: boolean;
  attachments?: FileAttachment[];
  created_at: string;
  updated_at: string;
}

export interface CreateMessageRequest {
  conversation_id: string;
  content: string;
  attachments?: FileAttachment[];
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
