import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check persistent login on app startup
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        // Validate token by fetching user profile
        // Backend endpoint: api/auth/profile/
        const res = await api.get('/profile/');
        setUser(res.data);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      // Tokens are invalid/expired, interceptor handles clearing them
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      // Backend endpoint: api/auth/login/
      const res = await api.post('/login/', { username, password });
      await AsyncStorage.setItem('access_token', res.data.access);
      await AsyncStorage.setItem('refresh_token', res.data.refresh);
      
      // Fetch user data
      const userRes = await api.get('/profile/');
      setUser(userRes.data);
    } catch (error) {
      throw error;
    }
  };

  const register = async (username, email, password, user_type = 'customer') => {
    try {
      // Backend endpoint: api/auth/register/
      await api.post('/register/', { username, email, password, user_type });
      // Automatically login after register
      await login(username, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
