export interface Department {
  id?: number | string;
  name: string;
  description?: string;
  head_employee_id?: number | string;
  branch_id?: number | string;
  branch?: any;
  head?: any;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentCreateRequest {
  name: string;
  description?: string;
  head_employee_id?: number | string;
  branch_id?: number | string;
  is_active?: boolean;
}

export interface DepartmentUpdateRequest extends Partial<DepartmentCreateRequest> {}
