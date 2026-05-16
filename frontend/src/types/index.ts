export type UserRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export type TransactionType =
  | 'REVENUE'
  | 'EXPENSE'
  | 'TAX'
  | 'WITHDRAWAL'
  | 'TRANSFER'
  | 'CMV';

export type ImportStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  companyId?: string;
  createdAt?: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
  subcategory?: string;
  bankAccount?: string;
  reference?: string;
  notes?: string;
  source: 'MANUAL' | 'IMPORT' | 'AI';
  aiClassified: boolean;
  aiConfidence?: number;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface FinancialSummary {
  revenue: number;
  expenses: number;
  cmv: number;
  grossProfit: number;
  netProfit: number;
  taxes: number;
  withdrawals: number;
  grossMargin: number;
  netMargin: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  type: TransactionType;
}

export interface ImportHistory {
  id: string;
  fileName: string;
  fileType: string;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  createdAt: string;
  completedAt?: string;
  errors?: string[];
}

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'tip';
  title: string;
  description: string;
  metric?: string;
  value?: number;
  generatedAt: string;
}

export interface DRELine {
  label: string;
  value: number;
  percentage?: number;
  isTotal?: boolean;
  isNegative?: boolean;
}

export interface DREReport {
  period: string;
  grossRevenue: number;
  deductions: number;
  netRevenue: number;
  cmv: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  operatingProfit: number;
  taxes: number;
  netProfit: number;
  netMargin: number;
}

export interface CompanyStats {
  revenue: number;
  expenses: number;
  netProfit: number;
  cmv: number;
  grossMargin: number;
  netMargin: number;
  revenueGrowth: number;
  transactionCount: number;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'tip';
  title: string;
  description: string;
  metric?: string;
  value?: number;
  generatedAt: string;
}

export interface DREReport {
  period: string;
  grossRevenue: number;
  deductions: number;
  netRevenue: number;
  cmv: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  operatingProfit: number;
  taxes: number;
  netProfit: number;
  netMargin: number;
}

export interface CompanyStats {
  totalTransactions: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cmvPercentage: number;
  activeCategories: number;
  lastImportDate?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  label?: string;
}
