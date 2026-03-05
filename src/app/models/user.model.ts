export interface User {
  id: number | string; // Support both number and UUID string
  username: string;
  email: string;
  role: UserRole;
  employee_id?: number | string; // Support both number and UUID string
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export enum UserRole {
  ADMIN = 'admin',
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

export interface UserAccount {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  employee_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  employee?: any;
}
