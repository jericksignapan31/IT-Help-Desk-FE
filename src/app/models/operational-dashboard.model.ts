export interface DepartmentMetrics {
  department_id: string;
  department_name: string;
  ticket_count: number;
  open_count: number;
  in_progress_count: number;
  resolved_count: number;
  closed_count: number;
}

export interface OperationalDashboardDto {
  month: number;
  year: number;
  total_tickets: number;
  total_open_tickets: number;
  department_metrics: DepartmentMetrics[];
}
