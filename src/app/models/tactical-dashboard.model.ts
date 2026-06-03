export interface TacticalDepartmentMetrics {
  department_id: string;
  department_name: string;
  requisition_count: number;
  approved_count: number;
  pending_count: number;
  total_costing: number;
  average_costing: number;
}

export interface TacticalDashboardDto {
  month: number;
  year: number;
  total_requisitions: number;
  total_costing: number;
  department_metrics: TacticalDepartmentMetrics[];
}
