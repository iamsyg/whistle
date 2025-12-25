import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useDispatch } from 'react-redux';
import { setEmail as setEmailState } from '@/store/slices/auth/emailAuthSlice';

export default function EmailScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  
  const emailInputRef = useRef<TextInput>(null);

  const dispatch = useDispatch();

  // Validate email format
  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setError('Email is required to verify');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    setError('');
    return true;
  };

  // Handle email input change
  const handleEmailChange = (text: string) => {
    setEmail(text);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
    
    // Validate email format as user types
    const isValid = /^[^\s@]+@[^\s@]+$/.test(text);
    setIsEmailValid(isValid && text.includes('@'));
  };

  // Handle Verify Email button press
  const handleVerifyEmail = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call to send OTP to email

      dispatch(setEmailState(email));

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to OTP screen with email parameter
      router.push({
        pathname: '/(auth)/email-otp',
        params: { email },
      });
      
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send verification code. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Skip button press
  const handleSkip = () => {
    Alert.alert(
      'Skip Email Verification',
      'You can add and verify your email later. Continue without email verification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          style: 'default',
          onPress: () => router.replace('/(auth)/profile-setup'),
        },
      ]
    );
  };

  // Auto-focus email input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Validate email on blur
  const handleEmailBlur = () => {
    if (email.trim()) {
      validateEmail(email);
    }
  };

  // Handle Enter key press
  const handleEmailSubmit = () => {
    if (email.trim()) {
      handleVerifyEmail();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              {/* Header Section */}
              <View style={styles.header}>
                <Text style={styles.title}>Add your email</Text>
                {/* <Text style={styles.subtitle}>
                  We'll use this for account recovery and notifications
                </Text> */}
              </View>

              {/* Email Input Section */}
              <View style={styles.inputSection}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    ref={emailInputRef}
                    style={[
                      styles.input,
                      error && styles.inputError,
                      email && styles.inputFilled,
                    ]}
                    value={email}
                    onChangeText={handleEmailChange}
                    onBlur={handleEmailBlur}
                    onSubmitEditing={handleEmailSubmit}
                    placeholder="Enter email address"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!loading}
                    returnKeyType="go"
                  />
                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorIcon}>⚠️</Text>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : (
                    <Text style={styles.helperText}>
                      Enter a valid email address to receive verification code
                    </Text>
                  )}
                </View>

                {/* Info Box */}
                {/* <View style={styles.infoBox}>
                  <Text style={styles.infoIcon}>📧</Text>
                  <Text style={styles.infoText}>
                    Email verification helps secure your account and enables important notifications
                  </Text>
                </View> */}
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    (!email.trim() || loading) && styles.verifyButtonDisabled,
                  ]}
                  onPress={handleVerifyEmail}
                  disabled={!email.trim() || loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Verify Email</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.skipButtonText,
                    loading && styles.skipButtonDisabled
                  ]}>
                    Skip for now
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Footer Info */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  You can add and verify your email anytime from account settings
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1971c2',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '90%',
  },
  inputSection: {
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: 56,
  },
  inputFilled: {
    backgroundColor: '#fff',
    borderColor: '#1971c2',
  },
  inputError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
  },
  errorIcon: {
    marginRight: 6,
    fontSize: 14,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  helperText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e7f5ff',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    color: '#1971c2',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: 8,
  },
  verifyButton: {
    backgroundColor: '#1971c2',
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1971c2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    backgroundColor: '#a5d8ff',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#1971c2',
    fontWeight: '600',
  },
  skipButtonDisabled: {
    color: '#a5d8ff',
  },
  footer: {
    marginTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});