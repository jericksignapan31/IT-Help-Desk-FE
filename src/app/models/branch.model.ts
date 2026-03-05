export interface Branch {
  branch_id?: number | string;
  branch_name: string;
  location: string;
  contact_number?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  assets?: any[];
  employees?: any[];
}

export interface BranchCreateRequest {
  branch_name: string;
  location: string;
  contact_number?: string;
  status?: string;
}

export interface BranchUpdateRequest extends Partial<BranchCreateRequest> {}
