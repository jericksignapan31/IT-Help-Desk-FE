export interface Brand {
  id?: number | string;
  brand_name: string;
  description?: string;
  brand_image_url?: string;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BrandCreateRequest {
  brand_name: string;
  description?: string;
  brand_image_url?: string;
  status?: boolean;
}

export interface BrandUpdateRequest extends Partial<BrandCreateRequest> {}

// Common computer hardware brands for reference
export const COMMON_HARDWARE_BRANDS: Partial<Brand>[] = [
  // Computer & Laptop Brands
  { brand_name: 'Dell', description: 'Dell Inc.' },
  { brand_name: 'HP', description: 'Hewlett-Packard' },
  { brand_name: 'Lenovo', description: 'Lenovo Group' },
  { brand_name: 'Asus', description: 'ASUSTeK Computer' },
  { brand_name: 'Acer', description: 'Acer Inc.' },
  { brand_name: 'Apple', description: 'Apple Inc.' },
  { brand_name: 'MSI', description: 'Micro-Star International' },
  { brand_name: 'Samsung', description: 'Samsung Electronics' },
  { brand_name: 'Microsoft', description: 'Microsoft Corporation' },
  { brand_name: 'Toshiba', description: 'Toshiba Corporation' },
  { brand_name: 'Huawei', description: 'Huawei Technologies' },
  { brand_name: 'LG', description: 'LG Electronics' },

  // Processor Brands
  { brand_name: 'Intel', description: 'Intel Corporation' },
  { brand_name: 'AMD', description: 'Advanced Micro Devices' },

  // Component Brands
  { brand_name: 'Gigabyte', description: 'Gigabyte Technology' },
  { brand_name: 'ASRock', description: 'ASRock Inc.' },
  { brand_name: 'EVGA', description: 'EVGA Corporation' },
  { brand_name: 'Corsair', description: 'Corsair Gaming' },

  // Storage Brands
  { brand_name: 'Western Digital', description: 'Western Digital Corp.' },
  { brand_name: 'Seagate', description: 'Seagate Technology' },
  { brand_name: 'Kingston', description: 'Kingston Technology' },
  { brand_name: 'SanDisk', description: 'SanDisk Corp.' },
  { brand_name: 'Crucial', description: 'Crucial Technology' },

  // Monitor Brands
  { brand_name: 'BenQ', description: 'BenQ Corporation' },
  { brand_name: 'Philips', description: 'Philips Electronics' },
  { brand_name: 'AOC', description: 'AOC International' },
  { brand_name: 'ViewSonic', description: 'ViewSonic Corporation' },

  // Printer Brands
  { brand_name: 'Canon', description: 'Canon Inc.' },
  { brand_name: 'Epson', description: 'Seiko Epson Corporation' },
  { brand_name: 'Brother', description: 'Brother Industries' },
  { brand_name: 'Xerox', description: 'Xerox Corporation' },
  { brand_name: 'Ricoh', description: 'Ricoh Company' },

  // Networking Equipment
  { brand_name: 'Cisco', description: 'Cisco Systems' },
  { brand_name: 'TP-Link', description: 'TP-Link Technologies' },
  { brand_name: 'D-Link', description: 'D-Link Corporation' },
  { brand_name: 'Netgear', description: 'Netgear Inc.' },
  { brand_name: 'Ubiquiti', description: 'Ubiquiti Networks' },

  // Peripherals (Keyboard, Mouse)
  { brand_name: 'Logitech', description: 'Logitech International' },
  { brand_name: 'Razer', description: 'Razer Inc.' },
  { brand_name: 'SteelSeries', description: 'SteelSeries ApS' },
  { brand_name: 'HyperX', description: 'Kingston HyperX' },

  // Phone/Tablet Brands
  { brand_name: 'Oppo', description: 'Oppo Electronics' },
  { brand_name: 'Vivo', description: 'Vivo Communication Technology' },
  { brand_name: 'Xiaomi', description: 'Xiaomi Corporation' },
];
