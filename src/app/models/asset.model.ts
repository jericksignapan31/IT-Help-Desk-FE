import { Brand } from './brand.model';

export interface Asset {
  asset_id: string;
  asset_tag: string;
  category: AssetType;
  brand_id: string;
  model: string;
  serial_number?: string;
  status: AssetStatus;
  assigned_to?: string;
  branch_id: string;
  notes?: string;
  // Network Configuration (for computer/laptop)
  ip_address?: string;
  mac_address?: string;
  hostname?: string;
  anydesk_id?: string;
  // Hardware Specifications (for computer/laptop)
  specifications?: {
    cpu?: string;
    ram?: string;
    storage?: string;
    display?: string;
    os?: string;
  };
  created_at: string;
  updated_at: string;
  brand?: Brand;
  assignedEmployee?: any;
  branch?: any;
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
