// Repair Log is now a ticket timeline report
export interface RepairLog {
  ticket_id: number;
  ticket_subject: string;
  asset_name?: string;
  asset_tag?: string;
  employee_name: string;
  department?: string;
  priority: string;
  status: string;
  requested_date: string; // created_at
  approved_date?: string; // approved_at
  started_date?: string; // started_at
  completed_date?: string; // resolved_at
  total_days?: number; // calculated from requested to completed
  assigned_to?: string;
  observation?: string;
  action_taken?: string;
  recommendation?: string;
  resolution_notes?: string;
  unit_status?: string;
}
