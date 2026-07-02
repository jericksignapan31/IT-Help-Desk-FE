// Requisition Models

export interface RequisitionItem {
  item_id: string;
  item_name: string;
  quantity: number;
  unit: string; // pcs, box, set, etc.
  supplier?: string;
  unit_cost?: number | string;
  total_cost?: number | string;
  purpose_remarks?: string;
}

export interface CreateRequisitionItemDto {
  item_name: string;
  quantity: number;
  unit: string;
  supplier?: string;
  unit_cost?: number;
  total_cost?: number;
  purpose_remarks?: string;
}

export interface PartRequisition {
  requisition_id: string;
  rf_number: string;
  requested_by: string;
  requested_by_type: 'it' | 'warehouse';
  department?: string;
  deadline?: string;
  status: 'pending' | 'pending_admin_review' | 'approved' | 'rejected' | 'returned_by_warehouse';
  acknowledged_by?: string;
  acknowledged_at?: string;
  acknowledged_notes?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  items: RequisitionItem[];
  requester?: {
    employee_id: string;
    first_name: string;
    last_name: string;
  };
  acknowledger?: {
    employee_id: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreatePartRequisitionDto {
  rf_number: string; // NOW REQUIRED - IT must provide
  department?: string;
  deadline?: string | Date;
  items: CreateRequisitionItemDto[];
}

// Return & Resubmit DTOs
export interface ReturnRequisitionDto {
  warehouse_notes: string; // Min 10 characters
}

export interface AddCommentDto {
  message: string; // Min 5 characters
}

export interface ResubmitRequisitionDto {
  // Currently empty - can be extended for item modifications
}

// Return & History Models
export interface RequisitionReturn {
  return_id: string;
  requisition_id: string;
  returned_by: string;
  warehouse_notes: string;
  return_cycle: number;
  resubmitted_by?: string;
  resubmitted_at?: string;
  comments: RequisitionComment[];
  created_at: string;
  updated_at: string;
}

export interface RequisitionComment {
  comment_id: string;
  return_id: string;
  commented_by: string;
  role: 'it' | 'warehouse';
  message: string;
  created_at: string;
}

export interface RequisitionHistoryItem {
  return_id: string;
  requisition_id: string;
  returned_by: string;
  warehouse_notes: string;
  return_cycle: number;
  resubmitted_by?: string;
  resubmitted_at?: string;
  comments: RequisitionComment[];
  created_at: string;
}

export interface AcknowledgeRequisitionDto {
  acknowledged_notes?: string;
}

export interface ApproveRequisitionDto {
  action: 'approved' | 'rejected';
  rejection_reason?: string;
}
