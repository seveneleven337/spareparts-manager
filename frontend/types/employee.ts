export interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeListResponse {
  items: Employee[];
  total: number;
  limit: number;
  offset: number;
}

export interface EmployeeCreate {
  name: string;
  email: string;
  position: string;
}

export interface EmployeeUpdate {
  name?: string;
  email?: string;
  position?: string;
}