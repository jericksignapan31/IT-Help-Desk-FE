export interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  reporter_id: number;
  assigned_to?: number;
  asset_id?: number;
  branch_id: number;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  reporter?: any;
  assigned_technician?: any;
  asset?: any;
  branch?: any;
}

export enum TicketCategory {
  HARDWARE = 'hardware',
  SOFTWARE = 'software',
  NETWORK = 'network',
  PRINTER = 'printer',
  EMAIL = 'email',
  ACCESS = 'access',
  OTHER = 'other',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}
