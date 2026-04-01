export interface Department {
  department_id?: number | string;
  department_name: string;
  description?: string;
  head_employee_id?: number | string;
  head?: any;
  employees?: any[];
  status?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentCreateRequest {
  department_name: string;
  description?: string;
  head_employee_id?: number | string;
  status?: string;
}

export interface DepartmentUpdateRequest extends Partial<DepartmentCreateRequest> {}
