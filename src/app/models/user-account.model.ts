export interface UserAccount {
  id?: number | string;
  username: string;
  email: string;
  employee_id?: number | string;
  role: string;
  is_active?: boolean;
  last_login?: string;
  employee?: any;
  created_at?: string;
  updated_at?: string;
}

export interface UserAccountCreateRequest {
  username: string;
  password: string;
  email: string;
  employee_id?: number | string;
  role: string;
  is_active?: boolean;
}

export interface UserAccountUpdateRequest {
  username?: string;
  email?: string;
  employee_id?: number | string;
  role?: string;
  is_active?: boolean;
  password?: string;
}
