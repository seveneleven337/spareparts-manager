
export interface Warehouse {
  id: string;
  name: string;
  location: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarehouseListResponse {
  items: Warehouse[];
  total: number;
  limit: number;
  offset: number;
}

export interface WarehouseCreate {
  name: string;
  location: string;
  description: string | null;
}

export interface WarehouseUpdate {
  name?: string;
  location?: string;
  description?: string | null;
}
