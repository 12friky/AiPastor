import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { TokenProvider, useTokens } from './src/contexts/TokenContext';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import HomeScreen from './screens/HomeScreen';

function AppContent() {
  const { user, isLoading } = useAuth();
  const { refreshTokenStatus } = useTokens();
  const [authScreen, setAuthScreen] = useState('login');

  // Refresh token status whenever a user logs in
  useEffect(() => {
    if (user) {
      refreshTokenStatus();
    }
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6E63E7" />
      </View>
    );
  }

  if (!user) {
    return authScreen === 'signup' ? (
      <SignUp onSwitch={setAuthScreen} />
    ) : (
      <Login onSwitch={setAuthScreen} />
    );
  }

  return <HomeScreen />;
}

export default function App() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        AsyncStorage.removeItem('ai_chat_cache_v1');
      }
    });

    return () => {
      subscription.remove();
      AsyncStorage.removeItem('cached_sermon');
    };
  }, []);

  return (
    <AuthProvider>
      <TokenProvider>
        <AppContent />
        <StatusBar style="auto" />
      </TokenProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
