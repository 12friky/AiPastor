import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../apiService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on app startup
  useEffect(() => {
    bootstrapAsync();
  }, []);

  /**
   * Restore user session from AsyncStorage on app startup
   */
  const bootstrapAsync = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('token'),
      ]);

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Error restoring auth session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user with phone number and password
   * @param {string} phoneNumber - User's phone number
   * @param {string} password - User's password
   * @returns {Promise<Object>} User object if successful
   */
  const login = async (phoneNumber, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        throw new Error(data.message || 'Login failed');
      }

      // Save user and token to state
      setUser(data.user);
      setToken(data.token);

      // Persist to AsyncStorage
      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(data.user)),
        AsyncStorage.setItem('token', data.token),
      ]);

      return data.user;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up a new user
   * @param {Object} userData - User signup data
   * @returns {Promise<Object>} Success message if successful
   */
  const signup = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Signup failed');
        throw new Error(data.message || 'Signup failed');
      }

      return data;
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user and clear all auth state
   */
  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('token'),
      ]);
      setUser(null);
      setToken(null);
      setError(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    error,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
