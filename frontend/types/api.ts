// Global TypeScript interfaces (camelCase)

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin_tu' | 'kepala_sekolah';
  createdAt?: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
}
