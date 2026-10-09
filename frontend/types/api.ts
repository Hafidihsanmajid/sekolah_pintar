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
  semester?: 'Ganjil' | 'Genap' | string;
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
  academicYearId?: number;
  academicYearName?: string;
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
  dueDate?: string | null;
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

export interface Bill {
  id: number;
  studentId: number;
  studentName?: string;
  studentNis?: string;
  classroomName?: string;
  feeCategoryId: number;
  feeCategoryName?: string;
  feeCategoryType?: 'monthly' | 'incidental';
  academicYearId: number;
  academicYearName?: string;
  title: string;
  month?: number | null;
  year?: number | null;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'unpaid' | 'partially_paid' | 'paid';
  dueDate?: string | null;
  createdAt?: string;
}

export interface PaymentDetail {
  id: number;
  billId: number;
  billTitle?: string;
  feeCategoryName?: string;
  amount: number;
}

export interface Payment {
  id: number;
  invoiceNumber: string;
  studentId: number;
  studentName?: string;
  studentNis?: string;
  classroomName?: string;
  cashierId: number;
  cashierName?: string;
  paymentMethodId: number;
  paymentMethodName?: string;
  paymentMethodType?: 'cash' | 'transfer';
  totalAmount: number;
  paymentDate: string;
  status: 'completed' | 'void';
  notes?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  details?: PaymentDetail[];
  createdAt?: string;
}

export interface DashboardStats {
  today: {
    total: number;
    count: number;
    cash: number;
    transfer: number;
  };
  arrears: {
    total: number;
    studentsCount: number;
  };
  last7Days: Array<{
    date: string;
    day: string;
    tunai: number;
    transfer: number;
    total: number;
  }>;
}

export interface DailyCashReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalCash: number;
    totalTransfer: number;
    totalOverall: number;
    completedCount: number;
    voidCount: number;
    voidAmount: number;
  };
  byMethod: Array<{
    methodId: number;
    methodName: string;
    methodType: 'cash' | 'transfer';
    accountNumber?: string | null;
    transactionCount: number;
    totalAmount: number;
  }>;
  byFeeCategory: Array<{
    categoryName: string;
    totalAmount: number;
    count: number;
  }>;
  transactions: Array<{
    id: number;
    invoiceNumber: string;
    date: string;
    studentName?: string;
    classroomName?: string;
    methodName: string;
    methodType: 'cash' | 'transfer';
    totalAmount: number;
    cashierName?: string;
    status: 'completed' | 'void';
  }>;
}

export interface ArrearsStudent {
  studentId: number;
  studentNis: string;
  studentName: string;
  classroomName?: string;
  totalArrears: number;
  billCount: number;
  bills: Array<{
    id: number;
    title: string;
    categoryName?: string;
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate?: string | null;
  }>;
}

export interface ArrearsReport {
  summary: {
    totalStudentsWithArrears: number;
    totalUnpaidBillsCount: number;
    grandTotalArrears: number;
  };
  students: ArrearsStudent[];
}

export interface ReconciliationReport {
  period: {
    startDate: string;
    endDate: string;
  };
  channels: Array<{
    methodId: number;
    name: string;
    type: 'cash' | 'transfer';
    accountNumber?: string | null;
    accountHolder?: string | null;
    transactionCount: number;
    systemCalculatedTotal: number;
  }>;
}

export interface SchoolProfile {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  principalName?: string | null;
  treasurerName?: string | null;
  updatedAt?: string | null;
}
