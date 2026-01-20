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
