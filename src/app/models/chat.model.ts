// Chat and Chatbot Models

export interface Message {
  id: string;
  conversationId: string;
  type: 'user' | 'assistant' | 'system'; // User message, bot response, or system notification
  content: string;
  timestamp: Date;
  confidence?: number; // For AI responses
  interactionId?: string; // Link to interaction for feedback
  metadata?: {
    intent?: string;
    responseType?: 'FAQ' | 'TROUBLESHOOTING' | 'TICKET' | 'INFO';
    suggestedActions?: SuggestedAction[];
  };
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface ChatbotResponse {
  response: string;
  intent: string;
  confidence: number;
  responseType: 'FAQ' | 'TROUBLESHOOTING' | 'TICKET' | 'INFO';
  interactionId: string;
  suggestedActions: SuggestedAction[];
}

export interface SuggestedAction {
  type: 'TICKET' | 'FAQ' | 'SEARCH' | 'CONTACT';
  label: string;
  action: string;
}

export interface KnowledgeBaseEntry {
  knowledge_id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  confidence_score: number;
  usage_count: number;
  helpful_count?: number;
}

export interface ChatFeedback {
  interaction_id: string;
  satisfaction_score: number; // 1-5
  is_helpful: boolean;
  user_feedback: string;
  timestamp: Date;
}

export interface KBSearchResult {
  results: KnowledgeBaseEntry[];
  total: number;
}

export interface ChatbotStats {
  totalInteractions: number;
  averageConfidence: number;
  userSatisfaction: number; // 1-5
  totalKBEntries: number;
  totalTicketsCreated: number;
  avgResolutionTime: string;
}
