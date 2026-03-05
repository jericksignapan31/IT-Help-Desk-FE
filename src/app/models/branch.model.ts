export interface Branch {
  id?: number | string;
  branch_name: string;
  location: string;
  contact_number?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BranchCreateRequest {
  branch_name: string;
  location: string;
  contact_number?: string;
  status?: string;
}

export interface BranchUpdateRequest extends Partial<BranchCreateRequest> {}
