export interface Asset {
  id: number;
  asset_tag: string;
  type: AssetType;
  brand_id: number;
  model: string;
  serial_number?: string;
  status: AssetStatus;
  condition: AssetCondition;
  employee_id?: number;
  branch_id: number;
  purchase_date?: string;
  warranty_expiry?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  brand?: Brand;
  employee?: any;
  branch?: any;
}

export interface Brand {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export enum AssetType {
  COMPUTER = 'computer',
  LAPTOP = 'laptop',
  PRINTER = 'printer',
  MONITOR = 'monitor',
  PHONE = 'phone',
  TABLET = 'tablet',
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  OTHER = 'other',
}

export enum AssetStatus {
  AVAILABLE = 'available',
  IN_USE = 'in-use',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
  LOST = 'lost',
}

export enum AssetCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  BROKEN = 'broken',
}
