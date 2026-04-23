import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your production URL or machine's IP for local testing
const API_URL = 'http://10.0.2.2:8000/api/auth'; // 10.0.2.2 is the alias for host loopback in Android emulator

export const api = axios.create({
  baseURL: API_URL,
});

// Request Interceptor: Attach access token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        // Request new access token from api/auth/login/refresh/
        const res = await axios.post(`${API_URL}/login/refresh/`, {
          refresh: refreshToken,
        });

        const newAccess = res.data.access;
        await AsyncStorage.setItem('access_token', newAccess);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g. refresh token expired)
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        // The application state will eventually notice user is null
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
