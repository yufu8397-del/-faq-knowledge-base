import axios from 'axios';
import { FAQ, Category } from './types';

// 本番環境では相対パスを使用、開発環境ではlocalhostを使用
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプターでトークンを自動追加
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getFAQs = async (category?: string): Promise<FAQ[]> => {
  const params = category ? { category } : {};
  const response = await api.get('/faqs', { params });
  return response.data;
};

export const searchFAQs = async (query: string): Promise<FAQ[]> => {
  const response = await api.get('/faqs/search', { params: { q: query } });
  return response.data;
};

export const getFAQ = async (id: number): Promise<FAQ> => {
  const response = await api.get(`/faqs/${id}`);
  return response.data;
};

export const createFAQ = async (faq: Omit<FAQ, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'helpful_count'>): Promise<FAQ> => {
  const response = await api.post('/faqs', faq);
  return response.data;
};

export const updateFAQ = async (id: number, faq: Partial<FAQ>): Promise<FAQ> => {
  const response = await api.put(`/faqs/${id}`, faq);
  return response.data;
};

export const deleteFAQ = async (id: number): Promise<void> => {
  await api.delete(`/faqs/${id}`);
};

export const markHelpful = async (id: number): Promise<void> => {
  await api.post(`/faqs/${id}/helpful`);
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/categories');
  return response.data;
};

export const getStats = async (): Promise<any> => {
  const response = await api.get('/stats');
  return response.data;
};

export const extractQAFromChatHistory = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const baseUrl = process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api');
  
  const response = await fetch(`${baseUrl}/extract-qa`, {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
};

export const bulkCreateFAQs = async (pairs: Array<{question: string, answer: string}>, category?: string): Promise<any> => {
  const response = await api.post('/faqs/bulk', { pairs, category });
  return response.data;
};

export const login = async (password: string): Promise<any> => {
  const response = await api.post('/auth/login', { password });
  return response.data;
};

export const checkAuth = async (): Promise<any> => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return { authenticated: false, role: 'guest' };
  }
  
  const response = await fetch(`${API_BASE_URL}/auth/check`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// ドキュメント関連のAPI
export interface Document {
  id: number;
  title: string;
  content: string;
  category?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
  content_snippet?: string;
}

export const searchDocuments = async (query: string): Promise<Document[]> => {
  const response = await api.get('/documents/search', { params: { q: query } });
  return response.data;
};

export const getDocuments = async (): Promise<Document[]> => {
  const response = await api.get('/documents');
  return response.data;
};

export const uploadDocument = async (data: {
  title: string;
  content?: string;
  category?: string;
  tags?: string;
  file?: File;
}): Promise<Document> => {
  const formData = new FormData();
  formData.append('title', data.title);
  if (data.content) {
    formData.append('content', data.content);
  }
  if (data.category) {
    formData.append('category', data.category);
  }
  if (data.tags) {
    formData.append('tags', data.tags);
  }
  if (data.file) {
    formData.append('file', data.file);
  }

  const baseUrl = process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api');
  
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${baseUrl}/documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'アップロードに失敗しました');
  }
  
  return response.json();
};

export const deleteDocument = async (id: number): Promise<void> => {
  await api.delete(`/documents/${id}`);
};
