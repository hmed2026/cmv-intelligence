import axios, { AxiosInstance, AxiosProgressEvent } from 'axios';
import {
  User,
  Company,
  Transaction,
  FilterParams,
  PaginatedResponse,
  FinancialSummary,
  MonthlyData,
  CategoryBreakdown,
  ImportHistory,
  AIInsight,
  DREReport,
  CompanyStats,
} from '@/types';
import {
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  clearTokens,
} from '@/lib/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const companyId = getCompanyId();
    if (companyId) config.headers['X-Company-Id'] = companyId;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────
// Automatically unwraps backend { success, data } envelope so callers get
// res.data = the actual payload instead of res.data.data.
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Unwrap { success: true, data: ... } envelope
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken });
        const payload = response.data?.data ?? response.data;
        const { accessToken, refreshToken: newRefresh } = payload;
        setToken(accessToken);
        if (newRefresh) setRefreshToken(newRefresh);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>(
      '/api/v1/auth/login',
      { email, password }
    ),

  register: (name: string, email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>(
      '/api/v1/auth/register',
      { name, email, password }
    ),

  logout: () => api.post('/api/v1/auth/logout'),

  me: () => api.get<User>('/api/v1/auth/me'),

  refreshToken: (token: string) =>
    api.post<{ accessToken: string; refreshToken: string }>(
      '/api/v1/auth/refresh',
      { refreshToken: token }
    ),
};

// ─── Company API ─────────────────────────────────────────────────────────────
export const companyApi = {
  list: () => api.get<Company[]>('/api/v1/companies'),

  get: (id: string) => api.get<Company>(`/api/v1/companies/${id}`),

  create: (data: Partial<Company>) => api.post<Company>('/api/v1/companies', data),

  update: (id: string, data: Partial<Company>) =>
    api.put<Company>(`/api/v1/companies/${id}`, data),

  uploadLogo: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post<{ url: string }>(`/api/v1/companies/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getStats: (id: string) => api.get<CompanyStats>(`/api/v1/companies/${id}/stats`),
};

// ─── Transaction API ──────────────────────────────────────────────────────────
export const transactionApi = {
  list: (filters: FilterParams = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get<PaginatedResponse<Transaction>>(
      `/api/v1/transactions?${params.toString()}`
    );
  },

  get: (id: string) => api.get<Transaction>(`/api/v1/transactions/${id}`),

  create: (data: Partial<Transaction>) =>
    api.post<Transaction>('/api/v1/transactions', data),

  update: (id: string, data: Partial<Transaction>) =>
    api.put<Transaction>(`/api/v1/transactions/${id}`, data),

  delete: (id: string) => api.delete(`/api/v1/transactions/${id}`),

  getSummary: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get<FinancialSummary>(`/api/v1/transactions/summary?${params.toString()}`);
  },

  getMonthlyChart: (year: number) =>
    api.get<MonthlyData[]>(`/api/v1/transactions/chart/monthly?year=${year}`),

  getCategoryBreakdown: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get<CategoryBreakdown[]>(
      `/api/v1/transactions/chart/categories?${params.toString()}`
    );
  },
};

// ─── Upload API ───────────────────────────────────────────────────────────────
export const uploadApi = {
  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ importId: string; message: string }>('/api/v1/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      },
    });
  },

  history: () => api.get<ImportHistory[]>('/api/v1/upload/history'),

  getImport: (id: string) => api.get<ImportHistory>(`/api/v1/upload/${id}`),
};

// ─── Reports API ──────────────────────────────────────────────────────────────
export const reportApi = {
  getDRE: (month: number, year: number) =>
    api.get<DREReport>(`/api/v1/reports/dre?month=${month}&year=${year}`),

  getCMV: (startDate: string, endDate: string) =>
    api.get(`/api/v1/reports/cmv?startDate=${startDate}&endDate=${endDate}`),

  getFluxoCaixa: (startDate: string, endDate: string) =>
    api.get(`/api/v1/reports/fluxo-caixa?startDate=${startDate}&endDate=${endDate}`),

  getTopExpenses: (limit = 10) =>
    api.get<CategoryBreakdown[]>(`/api/v1/reports/top-expenses?limit=${limit}`),

  exportCSV: (reportType: string, params: Record<string, string>) => {
    const queryParams = new URLSearchParams({ type: reportType, ...params }).toString();
    return api.get(`/api/v1/reports/export?${queryParams}`, { responseType: 'blob' });
  },
};

// ─── AI API ───────────────────────────────────────────────────────────────────
export const aiApi = {
  classify: (description: string, amount: number) =>
    api.post<{ type: string; category: string; confidence: number }>('/api/v1/ai/classify', {
      description,
      amount,
    }),

  getInsights: () => api.get<AIInsight[]>('/api/v1/ai/insights'),

  analyzeDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/v1/ai/analyze-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
