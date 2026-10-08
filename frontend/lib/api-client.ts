import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types/api';
import { getAuthToken, removeAuthToken } from './auth-token';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8080/api';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Otomatis sisipkan Bearer token jika tersedia
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Tangani error 401 dan standardisasi payload
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      removeAuthToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    const errorPayload: ApiResponse = error.response?.data || {
      success: false,
      message: error.message || 'Terjadi kesalahan pada jaringan',
    };

    return Promise.reject(errorPayload);
  }
);

// Type-safe HTTP Methods Helper
export const apiClient = {
  async get<T>(url: string, paramsOrConfig?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const params =
      paramsOrConfig && 'params' in paramsOrConfig && typeof paramsOrConfig.params === 'object'
        ? (paramsOrConfig.params as Record<string, unknown>)
        : paramsOrConfig;
    const response = await axiosInstance.get<ApiResponse<T>>(url, { params });
    return response.data;
  },

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await axiosInstance.post<ApiResponse<T>>(url, data);
    return response.data;
  },

  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await axiosInstance.put<ApiResponse<T>>(url, data);
    return response.data;
  },

  async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await axiosInstance.patch<ApiResponse<T>>(url, data);
    return response.data;
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await axiosInstance.delete<ApiResponse<T>>(url);
    return response.data;
  },
};
