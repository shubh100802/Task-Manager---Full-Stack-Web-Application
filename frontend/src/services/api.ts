import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export interface TaskQueryParams {
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'dueDate' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// ========== one axios instance for the whole app ==========
const api = axios.create({
  baseURL: API_BASE_URL,
});

// ========== attach token automatically on every request ==========
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const statusCode = error?.response?.status;
    if (statusCode === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ========== auth requests ==========
export const authAPI = {
  register: (userData: { email: string; password: string }) =>
    api.post('/auth/register', userData),
  
  login: (userData: { email: string; password: string }) =>
    api.post('/auth/login', userData),
};

// ========== task requests ==========
export const taskAPI = {
  getTasks: (params?: TaskQueryParams) =>
    api.get('/tasks', { params }),
  
  createTask: (taskData: any) =>
    api.post('/tasks', taskData),
  
  updateTask: (id: string, taskData: any) =>
    api.put(`/tasks/${id}`, taskData),
  
  deleteTask: (id: string) =>
    api.delete(`/tasks/${id}`),
  
  markTaskComplete: (id: string) =>
    api.patch(`/tasks/${id}/complete`),
  
  getAnalytics: () =>
    api.get('/tasks/analytics'),
};

export default api;
