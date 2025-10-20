import axios from 'axios';
import { SearchFilters, SearchResponse, StatsResponse, HealthResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    return Promise.reject(error);
  }
);

export const emailAPI = {
  searchEmails: async (filters: SearchFilters): Promise<SearchResponse> => {
    const response = await api.get('/emails/search', { params: filters });
    return response.data;
  },

  getEmailById: async (id: string) => {
    const response = await api.get(`/emails/${id}`);
    return response.data;
  },

  deleteEmail: async (id: string) => {
    const response = await api.delete(`/emails/${id}`);
    return response.data;
  },

  getStats: async (): Promise<StatsResponse> => {
    const response = await api.get('/emails/stats');
    return response.data;
  },
};

export const aiAPI = {
  categorizeEmail: async (emailId: string) => {
    const response = await api.post('/ai/categorize', { emailId });
    return response.data;
  },

  suggestReplies: async (emailId: string, context: string[] = []) => {
    const response = await api.post('/ai/suggest-replies', { emailId, context });
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/ai/status');
    return response.data;
  },

  testConnection: async () => {
    const response = await api.post('/ai/test');
    return response.data;
  },
};

export const notificationAPI = {
  testSlack: async () => {
    const response = await api.post('/notifications/slack/test');
    return response.data;
  },

  sendSlackNotification: async (text: string, attachments?: any[]) => {
    const response = await api.post('/notifications/slack/send', { text, attachments });
    return response.data;
  },

  testWebhook: async () => {
    const response = await api.post('/notifications/webhook/test');
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/notifications/status');
    return response.data;
  },
};

export const healthAPI = {
  getHealth: async (): Promise<HealthResponse> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;

