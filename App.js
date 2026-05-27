import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import HomeScreen from './screens/HomeScreen';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState('login');

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
  return (
    <AuthProvider>
      <AppContent />
      <StatusBar style="auto" />
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
