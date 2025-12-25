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
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

const OTP_LENGTH = 6;
const RESEND_TIMER_SECONDS = 30;

export default function EmailOTPScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string || 'user@example.com';
  
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_TIMER_SECONDS);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const timerRef = useRef<number | null>(null);

  // Mask email for display (e.g., u***@e***.com)
  const maskEmail = (email: string): string => {
    if (!email) return 'your email';
    
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    
    const maskedLocal = localPart.length > 2 
      ? `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}`
      : localPart;
    
    const [domainName, extension] = domain.split('.');
    const maskedDomain = domainName && domainName.length > 2
      ? `${domainName[0]}${'*'.repeat(domainName.length - 2)}${domainName[domainName.length - 1]}`
      : domainName || '';
    
    return `${maskedLocal}@${maskedDomain}.${extension || 'com'}`;
  };

  // Countdown timer for resend OTP
  useEffect(() => {
      if (resendTimer > 0 && !canResend) {
        timerRef.current = setInterval(() => {
          setResendTimer(prev => {
            if (prev <= 1) {
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, [resendTimer, canResend]);

  // Handle OTP input change
  const handleChangeText = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input if text entered
    if (text && index < OTP_LENGTH - 1) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Auto-focus previous input if text deleted
    if (!text && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  // Handle backspace key press
  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  // Clear all OTP inputs
  const clearOTP = () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
    const firstInput = inputRefs.current[0];
    if (firstInput) {
      firstInput.focus();
    }
  };

  // Handle Verify OTP
  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== OTP_LENGTH) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock validation - always pass for demo
      // const isValid = otpString === '123456';
      const isValid = true; // Always pass for demo
      
      if (isValid) {
        Alert.alert(
          'Email Verified!',
          'Your email has been successfully verified.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to profile details screen
                // Use replace to prevent back navigation
                router.replace('/(auth)/profile-setup');
              },
            },
          ]
        );
      } else {
        setError('Invalid verification code. Please try again.');
        clearOTP();
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      clearOTP();
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOTP = () => {
    if (!canResend) return;

    // Reset timer and state
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setResendTimer(RESEND_TIMER_SECONDS);
    setCanResend(false);
    clearOTP();
    setError('');

    // Simulate resend OTP
    Alert.alert(
      'Code Resent',
      `New verification code has been sent to ${maskEmail(email)}`,
      [{ text: 'OK' }]
    );
  };

  // Check if all OTP digits are entered
  const isOTPComplete = otp.every(digit => digit !== '');

  // Format timer display
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get active input index
  const getActiveInputIndex = () => {
    const index = otp.findIndex(d => d === '');
    return index === -1 ? OTP_LENGTH - 1 : index;
  };

  // Auto-focus first OTP input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstInput = inputRefs.current[0];
      if (firstInput) {
        firstInput.focus();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const maskedEmail = maskEmail(email);
  const displayEmail = email.includes('@') ? maskedEmail : email;

  const { width } = Dimensions.get('window');
  const OTP_INPUT_SIZE = Math.min(60, (width - 96) / OTP_LENGTH);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.subtitle}>
                Code sent to {displayEmail}
              </Text>
            </View>

            {/* OTP Input Section */}
            <View style={styles.otpSection}>
              <Text style={styles.otpLabel}>Enter 6-digit code</Text>
              
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => {
                  const isActive = index === getActiveInputIndex();
                  const hasError = error.length > 0;
                  
                  return (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpInput,
                        { width: OTP_INPUT_SIZE, height: OTP_INPUT_SIZE },
                        digit && styles.otpInputFilled,
                        hasError && styles.otpInputError,
                        isActive && styles.otpInputActive,
                      ]}
                      value={digit}
                      onChangeText={(text) => handleChangeText(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      caretHidden={Platform.OS === 'android'}
                      contextMenuHidden={true}
                      importantForAutofill="no"
                      autoComplete="off"
                    />
                  );
                })}
              </View>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <TouchableOpacity onPress={clearOTP} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear code</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>📨</Text>
              <Text style={styles.infoText}>
                Check your email inbox (and spam folder) for the verification code
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (!isOTPComplete || loading) && styles.verifyButtonDisabled,
                ]}
                onPress={handleVerifyOTP}
                disabled={!isOTPComplete || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify Email</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendSection}>
                <Text style={styles.resendText}>Didn't receive the code? </Text>
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={!canResend}
                  style={styles.resendButton}
                >
                  <Text
                    style={[
                      styles.resendButtonText,
                      !canResend && styles.resendButtonDisabled,
                    ]}
                  >
                    Resend code {!canResend && `(${formatTimer(resendTimer)})`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer Info */}
            {/* <View style={styles.footer}>
              <Text style={styles.footerText}>
                Email verification adds an extra layer of security to your account
              </Text>
            </View> */}
          </View>
        </ScrollView>
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
  otpSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  otpLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    fontSize: 24,
    fontWeight: '600',
    color: '#1971c2',
    textAlign: 'center',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  otpInputFilled: {
    backgroundColor: '#fff',
    borderColor: '#1971c2',
    shadowColor: '#1971c2',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  otpInputActive: {
    borderColor: '#4dabf7',
    backgroundColor: '#f0f9ff',
  },
  otpInputError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  clearButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
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
    marginBottom: 24,
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
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#1971c2',
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: '#999',
    fontWeight: '400',
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});