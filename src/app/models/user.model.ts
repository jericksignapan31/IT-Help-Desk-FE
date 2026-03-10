export interface User {
  id: number | string; // Support both number and UUID string
  username: string;
  email: string;
  role: UserRole;
  employee_id?: number | string; // Support both number and UUID string
  is_active: boolean;
  is_verified?: boolean; // Admin verification status
  created_at: string;
  updated_at: string;
}

export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  TECHNICIAN = 'technician',
  USER = 'user',
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
