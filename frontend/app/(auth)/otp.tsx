// frontend/app/(auth)/otp.tsx

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
import { useDispatch, useSelector } from 'react-redux';
import { setPhoneNumber, setPhoneNumberVerified, setCountryCode } from '@/store';
import { RootState } from '@/store/store';

// Define route params as a type, not interface for useLocalSearchParams
type OTPRouteParams = {
  phoneNumber: string;
  maskedPhoneNumber: string;
};

const OTP_LENGTH = 6;
const RESEND_TIMER_SECONDS = 30;

export default function OTPScreen() {
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_TIMER_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const timerRef = useRef<number | null>(null);

  const dispatch = useDispatch();

  const { phoneNumber, countryCode } = useSelector(
    (state: RootState) => state.auth
  );

  // Parse phone number from params with type safety
  const maskedPhoneNumber = params.maskedPhoneNumber as string ||
    (phoneNumber.replace(/\D/g, '').length > 4
      ? `+91 *****${phoneNumber.replace(/\D/g, '').slice(-4)}`
      : '+91 ******');

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

  // Auto-focus next input and handle backspace
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      const isValid = otpString === '123456'; // mock

      if (!isValid) {
        setError('Invalid OTP. Please try again.');
        clearOTP();
        return;
      }

      // ✅ SUCCESS
      dispatch(setPhoneNumberVerified(true));
      router.replace('/(auth)/email');

    } catch {
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

    // Simulate resend OTP API call
    Alert.alert(
      'OTP Resent',
      `New OTP has been sent to ${maskedPhoneNumber}`,
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

  // Set initial focus on first OTP input
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstInput = inputRefs.current[0];
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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
          <View style={styles.container} ref={containerRef}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Verify OTP</Text>
              <Text style={styles.subtitle}>
                OTP sent to {maskedPhoneNumber}
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
                  <Text style={styles.clearButtonText}>Clear OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify Button */}
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
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>

            {/* Resend Section */}
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
                  Resend OTP {!canResend && `(${formatTimer(resendTimer)})`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info Text */}
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                Make sure you enter the code sent to your phone number.
                The code expires in 5 minutes.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const OTP_INPUT_SIZE = Math.min(60, (width - 96) / 6);

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
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1971c2',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  otpSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  otpLabel: {
    fontSize: 16,
    color: '#444',
    marginBottom: 24,
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  otpInput: {
    width: OTP_INPUT_SIZE,
    height: OTP_INPUT_SIZE,
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
    marginTop: 8,
    fontWeight: '500',
  },
  clearButton: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: '#1971c2',
    height: 56,
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
    fontWeight: '600',
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
  infoSection: {
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
});

// Remove the unused containerRef reference
const containerRef = { current: null };