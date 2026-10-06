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
  pagination: PaginationMeta;
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

export interface AcademicYear {
  id: number;
  name: string;
  semester: 'Ganjil' | 'Genap';
  isActive: boolean;
  classroomsCount?: number;
  createdAt?: string;
}

export interface Classroom {
  id: number;
  academicYearId: number;
  academicYearName?: string;
  name: string;
  level: string;
  studentsCount?: number;
  createdAt?: string;
}

export interface Student {
  id: number;
  nis: string;
  nisn?: string | null;
  name: string;
  classroomId: number;
  classroomName?: string;
  classroomLevel?: string;
  entryYear: string;
  isActive: boolean;
  phoneNumber?: string | null;
  address?: string | null;
  createdAt?: string;
}

export interface FeeCategory {
  id: number;
  name: string;
  type: 'monthly' | 'incidental';
  defaultAmount: number;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: 'cash' | 'transfer';
  accountNumber?: string | null;
  accountHolder?: string | null;
  isActive: boolean;
  createdAt?: string;
}
