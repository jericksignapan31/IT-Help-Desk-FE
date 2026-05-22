export interface User {
  id: number | string;
  username: string;
  email: string;
  role: UserRole;
  employee_id?: number | string;
  is_active: boolean;
  is_verified?: boolean;
  password_changed?: boolean;
  created_at: string;
  updated_at: string;
  employee?: {
    employee_id: string;
    branch_id: string;
    department_id: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    role: string;
    position: string;
    contact_number?: string;
    employment_status: boolean;
    branch?: {
      branch_id: string;
      branch_name: string;
      location: string;
      contact_number: string;
      status: string;
      created_at: string;
      updated_at: string;
    };
    department?: {
      department_id: string;
      department_name: string;
      description: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    };
    created_at: string;
    updated_at: string;
  };
}

export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  IT = 'it',
  EMPLOYEE = 'employee',
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterRequest {
  employee_id: string;
  branch_id: string;
  department_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  role: string;
  position: string;
  contact_number?: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  email?: string;
  temporaryPassword?: string;
  user?: User;
}

export interface UserAccount {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  employee_id?: number;
  is_active: boolean;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
  employee?: any;
}
