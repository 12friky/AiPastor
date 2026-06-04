import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function SignUp({ onSwitch }) {
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',           // matches backend field
    password: '',
    phoneNumber: '',
    churchName: '',
    denomination: '',
    role: 'Senior Pastor',              // matches backend field
    bibleTranslation: 'NIV — New International Version', // matches backend field
  });

  const denominations = [
    'Pentecostal',
    'Catholic',
    'Baptist',
    'Anglican',
    'Methodist',
    'Orthodox',
    'Other',
  ];

  const bibleTranslations = [
    'NIV — New International Version',
    'KJV — King James Version',
    'ESV — English Standard Version',
    'NASB — New American Standard Bible',
    'NKJV — New King James Version',
    'NLT — New Living Translation',
  ];

  const handleStep1Submit = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Validation', 'Please enter your full name.');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation', 'Please enter your email address.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters.');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Validation', 'Please enter your phone number.');
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = async () => {
    if (!formData.churchName.trim()) {
      Alert.alert('Validation', 'Please enter your church name.');
      return;
    }
    if (!formData.denomination) {
      Alert.alert('Validation', 'Please select your denomination.');
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phoneNumber: formData.phoneNumber.trim(),
        churchName: formData.churchName.trim(),
        denomination: formData.denomination,
        role: formData.role,
        bibleTranslation: formData.bibleTranslation,
      });

      Alert.alert(
        'Account Created ✅',
        `Welcome, ${formData.fullName}! Your account is ready. Please log in.`,
        [{ text: 'Log In', onPress: () => onSwitch && onSwitch('login') }]
      );
    } catch (error) {
      // Show the backend's message directly — it's already user-friendly
      Alert.alert('Sign Up Failed', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.stepIndicator}>2 — SIGN UP · STEP 1</Text>
        <Text style={styles.title}>Create account</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>FULL NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="Pastor Samuel Boateng"
          value={formData.fullName}
          onChangeText={(text) => updateField('fullName', text)}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput
          style={styles.input}
          placeholder="samuel@grace.church"
          value={formData.email}
          onChangeText={(text) => updateField('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          placeholder="**********"
          value={formData.password}
          onChangeText={(text) => updateField('password', text)}
          secureTextEntry
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>PHONE NUMBER</Text>
        <TextInput
          style={styles.input}
          placeholder="+233 24 000 0000"
          value={formData.phoneNumber}
          onChangeText={(text) => updateField('phoneNumber', text)}
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.continueButton} onPress={handleStep1Submit}>
          <Text style={styles.continueButtonText}>Continue →</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign up with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialButtonText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialButtonText}>Apple</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.stepIndicator}>YOUR MINISTRY</Text>
        <Text style={styles.subtitle}>
          This helps AI Pastor personalise your sermons and prayers to your tradition.
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>CHURCH NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="Grace Community Church"
          value={formData.churchName}
          onChangeText={(text) => updateField('churchName', text)}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>DENOMINATION</Text>
        <View style={styles.optionsGrid}>
          {denominations.map((denom) => (
            <TouchableOpacity
              key={denom}
              style={[
                styles.optionButton,
                formData.denomination === denom && styles.optionButtonActive,
              ]}
              onPress={() => updateField('denomination', denom)}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.denomination === denom && styles.optionTextActive,
                ]}
              >
                {denom}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>YOUR ROLE</Text>
        <View style={styles.roleContainer}>
          {['Senior Pastor', 'Associate Pastor', 'Youth Pastor', 'Evangelist', 'Deacon', 'Other'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleButton, formData.role === r && styles.roleButtonActive]}
              onPress={() => updateField('role', r)}
            >
              <Text style={[styles.roleText, formData.role === r && styles.roleTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>PREFERRED BIBLE TRANSLATION</Text>
        <View style={styles.translationContainer}>
          {bibleTranslations.map((translation) => (
            <TouchableOpacity
              key={translation}
              style={[
                styles.translationButton,
                formData.bibleTranslation === translation && styles.translationButtonActive,
              ]}
              onPress={() => updateField('bibleTranslation', translation)}
            >
              <Text
                style={[
                  styles.translationText,
                  formData.bibleTranslation === translation && styles.translationTextActive,
                ]}
              >
                {translation}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.setupButton, isLoading && { opacity: 0.6 }]}
          onPress={handleStep2Submit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.setupButtonText}>Set up my account</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerNote}>You can change these later in Settings</Text>
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {step === 1 ? renderStep1() : renderStep2()}
      {step === 2 && (
        <TouchableOpacity style={styles.backLink} onPress={() => setStep(1)}>
          <Text style={styles.backLinkText}>← Back to Step 1</Text>
        </TouchableOpacity>
      )}
      {step === 1 && (
        <TouchableOpacity style={styles.loginLink} onPress={() => onSwitch && onSwitch('login')}>
          <Text style={styles.loginLinkText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  stepContainer: {
    flex: 1,
    padding: 24,
  },
  headerContainer: {
    marginBottom: 32,
    marginTop: 20,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#000',
  },
  continueButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 12,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 14,
    borderRadius: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  optionButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  optionButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextActive: {
    color: '#fff',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  roleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  roleButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  roleText: {
    fontSize: 14,
    color: '#333',
  },
  roleTextActive: {
    color: '#fff',
  },
  translationContainer: {
    gap: 10,
    marginTop: 4,
  },
  translationButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  translationButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  translationText: {
    fontSize: 14,
    color: '#333',
  },
  translationTextActive: {
    color: '#fff',
  },
  setupButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  loginLink: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  loginLinkText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  backLink: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  backLinkText: {
    color: '#666',
    fontSize: 14,
  },
});