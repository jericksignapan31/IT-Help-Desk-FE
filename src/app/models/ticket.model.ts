import { TicketPart } from './ticket-part.model';

export interface Ticket {
  ticket_id: number;
  employee_id: number;
  asset_id?: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  approval_status: ApprovalStatus;
  subject: string;
  description: string;
  image_url?: string;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  assigned_to?: number;
  resolution_notes?: string;
  started_at?: string;
  resolved_at?: string;
  unit_status?: string;
  observation?: string;
  action_taken?: string;
  recommendation?: string;
  created_at: string;
  updated_at?: string;
  department_id?: string; // From reporter's employee record
  parts?: TicketPart[]; // NEW: Parts tracking
  reporter?: any;
  asset?: any;
  assignedEmployee?: any;
  approver?: any;
}

export interface TicketCompletionData {
  unit_status: string;
  observation: string;
  action_taken: string;
  recommendation: string;
  resolution_notes?: string;
}

export enum TicketCategory {
  HARDWARE = 'hardware',
  SOFTWARE = 'software',
  NETWORK = 'network',
  OTHER = 'other',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TicketStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_PARTS = 'waiting_for_parts',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
