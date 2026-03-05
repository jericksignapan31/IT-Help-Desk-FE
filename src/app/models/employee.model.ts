export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department_id: number;
  branch_id: number;
  hire_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: Department;
  branch?: Branch;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}
