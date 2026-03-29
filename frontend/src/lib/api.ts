import axios from 'axios';
import { store } from '../redux/store';
import { setAuthUser, setToken } from '../redux/authSlice';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
});

// ─── Request Interceptor: Attach Authorization header ───
API.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor: Silent Token Refresh with Queue ───
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Token expired — attempt silent refresh
    if (
      error.response?.status === 401 &&
      error.response?.data?.expired === true &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => API(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await API.post('/users/refresh');
        // Save new token from response body
        if (res.data.accessToken) {
          store.dispatch(setToken(res.data.accessToken));
        }
        processQueue(null);
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        store.dispatch(setToken(null));
        store.dispatch(setAuthUser(null));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Non-expired 401 — clear stale state
    if (error.response?.status === 401) {
      const currentUser = store.getState().auth.user;
      if (currentUser && !originalRequest?.url?.includes('/login') && !originalRequest?.url?.includes('/refresh')) {
        store.dispatch(setToken(null));
        store.dispatch(setAuthUser(null));
      }
    }

    return Promise.reject(error);
  }
);

export default API;
