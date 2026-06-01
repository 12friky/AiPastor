import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../apiService';

const TokenContext = createContext();

const TOKEN_CACHE_KEY = 'token_status_cache_v1';

export const TokenProvider = ({ children }) => {
  const [tokenStatus, setTokenStatus] = useState({
    plan: 'free',
    tokensRemaining: 20,
    tokensUsed: 0,
    isPremium: false,
    isExpired: false,
    loaded: true, // default values are valid — show immediately, backend will update
  });

  // Restore cached status on mount — keeps loaded: true so UI always renders
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(TOKEN_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Merge cached values and keep loaded: true
          setTokenStatus((prev) => ({ ...prev, ...parsed, loaded: true }));
        }
      } catch (_) {}
    })();
  }, []);

  /**
   * Fetch fresh token status from the backend.
   * Call this on app start, after every AI request, and when the user
   * navigates to a screen that needs token info.
   */
  const refreshTokenStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/user/token-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();
      if (!data.success) return;

      const next = {
        plan: data.plan,
        tokensRemaining: data.tokensRemaining,
        tokensUsed: data.tokensUsed,
        isPremium: data.isPremium,
        isExpired: data.isExpired,
        loaded: true,
      };

      setTokenStatus(next);
      await AsyncStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn('TokenContext: refreshTokenStatus failed', err.message);
    }
  }, []);

  /**
   * Optimistically deduct tokens locally after a successful AI call.
   * The next refreshTokenStatus() will sync the real value from the server.
   */
  const deductTokens = useCallback((cost) => {
    setTokenStatus((prev) => {
      const next = {
        ...prev,
        tokensRemaining: Math.max(0, prev.tokensRemaining - cost),
        tokensUsed: prev.tokensUsed + cost,
      };
      next.isExpired = next.plan === 'free' && next.tokensRemaining === 0;
      AsyncStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  /**
   * Clear cached token status on logout.
   */
  const clearTokenStatus = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_CACHE_KEY);
    setTokenStatus({
      plan: 'free',
      tokensRemaining: 20,
      tokensUsed: 0,
      isPremium: false,
      isExpired: false,
      loaded: true,
    });
  }, []);

  return (
    <TokenContext.Provider
      value={{
        ...tokenStatus,
        refreshTokenStatus,
        deductTokens,
        clearTokenStatus,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export const useTokens = () => {
  const ctx = useContext(TokenContext);
  if (!ctx) throw new Error('useTokens must be used within TokenProvider');
  return ctx;
};
