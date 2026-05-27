import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';

export default function Login({ onSwitch }) {
  const { login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneNumber = (text) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX
    let formatted = cleaned;
    if (cleaned.length > 0) {
      if (cleaned.length <= 3) {
        formatted = `(${cleaned}`;
      } else if (cleaned.length <= 6) {
        formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      } else {
        formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      }
    }
    setPhoneNumber(formatted);
  };

  const handleSubmit = async () => {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      Alert.alert('Validation', 'Please enter a valid phone number');
      return;
    }
    if (!password) {
      Alert.alert('Validation', 'Please enter your password');
      return;
    }
    
    setIsLoading(true);
    try {
      await login(cleanedPhone, password);
      // On success, App.js will detect the user change and navigate to Home automatically.
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="cross-outline" size={36} color="#534AB7" />
          </View>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        {/* Bible Verse Card - Light Version */}
        <View style={styles.verseCard}>
          <Ionicons name="book-outline" size={20} color="#0F6E56" style={styles.verseIcon} />
          <Text style={styles.verseText}>
            "Come to me, all who are weary, and I will give you rest."
          </Text>
          <Text style={styles.verseRef}>Matthew 11:28</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Phone Number Input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#534AB7" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#B0B0B0"
              value={phoneNumber}
              onChangeText={formatPhoneNumber}
              keyboardType="phone-pad"
              maxLength={14}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#534AB7" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#B0B0B0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#534AB7" 
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up Link - Moved inside content with margin above */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>New to Ai Pastor? </Text>
          <TouchableOpacity onPress={() => onSwitch && onSwitch('signup')}>
            <Text style={styles.signUpText}>Create account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: Platform.OS === 'ios' ? 60 : 40, // Raised from bottom
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8F7F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E8E6F0',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#26215C',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E9A',
    fontWeight: '400',
  },
  verseCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E8F4F0',
    alignItems: 'center',
  },
  verseIcon: {
    marginBottom: 12,
    opacity: 0.7,
  },
  verseText: {
    color: '#4A4A5A',
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  verseRef: {
    color: '#0F6E56',
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
  formSection: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E6F0',
    paddingHorizontal: 16,
    marginBottom: 12,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#26215C',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  forgotPasswordText: {
    color: '#534AB7',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#534AB7',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#F8F7F4',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32, // Space from button
    paddingVertical: 8,
  },
  footerText: {
    color: '#8E8E9A',
    fontSize: 14,
  },
  signUpText: {
    color: '#534AB7',
    fontSize: 14,
    fontWeight: '600',
  },
});