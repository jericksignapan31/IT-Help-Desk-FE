export interface Brand {
  id?: number | string;
  name: string;
  description?: string;
  manufacturer?: string;
  website_url?: string;
  support_email?: string;
  support_phone?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BrandCreateRequest {
  name: string;
  description?: string;
  manufacturer?: string;
  website_url?: string;
  support_email?: string;
  support_phone?: string;
  is_active?: boolean;
}

export interface BrandUpdateRequest extends Partial<BrandCreateRequest> {}
