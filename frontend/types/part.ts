export interface Part {
  id: number;
  name: string;
  description: string | null;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface PartListResponse {
  items: Part[];
  total: number;
  limit: number;
  offset: number;
}

export interface PartCreate {
  name: string;
  description: string | null;
  stock_quantity: number;
}

export interface PartUpdate {
  name?: string;
  description?: string | null;
  stock_quantity?: number;
}