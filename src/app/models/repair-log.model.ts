export interface RepairLog {
  id: number;
  asset_id: number;
  ticket_id?: number;
  repair_type: string;
  description: string;
  repair_date: string;
  repairer: string;
  cost?: number;
  status: RepairStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  asset?: any;
  ticket?: any;
}

export enum RepairStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
