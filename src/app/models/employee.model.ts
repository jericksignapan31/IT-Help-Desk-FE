export interface Employee {
  employee_id?: number | string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  contact_number?: string;
  position: string;
  role?: string;
  department_id?: number | string;
  branch_id?: number | string;
  hire_date?: string;
  employment_status?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  department?: any;
  branch?: any;
}

export interface EmployeeCreateRequest {
  employee_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  contact_number?: string;
  position: string;
  role?: string;
  department_id?: number | string;
  branch_id?: number | string;
  employment_status?: boolean;
}

export interface EmployeeUpdateRequest extends Partial<EmployeeCreateRequest> {}
