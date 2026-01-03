// frontend/app/(auth)/otp.tsx - WITH DEBUGGING

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
import { setPhoneNumberVerified } from '@/store';
import { RootState } from '@/store/store';
import { supabase } from '@/utils/supabase';
import { setUserId } from '@/store/slices/auth/profileSlice';

import { normalizePhoneNumber, hashPhoneNumber, debugPhoneNumber } from '@/utils/phoneUtils';


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

  useEffect(() => {
    if (!phoneNumber || !countryCode) {
      router.replace('/(auth)/login');
    }
  }, [phoneNumber, countryCode]);

  const phoneForSupabase = phoneNumber;
  const phoneForBackend = phoneNumber;

  const maskedPhoneNumber = params.maskedPhoneNumber as string ||
    (phoneNumber.replace(/\D/g, '').length > 4
      ? `${countryCode} *****${phoneNumber.replace(/\D/g, '').slice(-4)}`
      : `${countryCode} ******`);

  useEffect(() => {
    if (resendTimer > 0 && !canResend) {
      timerRef.current = window.setInterval(() => {
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

  const handleChangeText = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setError('');

    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (!text && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const clearOTP = () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
    inputRefs.current[0]?.focus();
  };

  //   const normalizePhoneNumber = (phone: string): string => {
  //   // Remove spaces, hyphens, brackets
  //   const cleaned = phone.replace(/[^\d+]/g, "");

  //   // Must start with +
  //   if (!cleaned.startsWith("+")) {
  //     throw new Error("Phone number must be in E.164 format");
  //   }

  //   // E.164 length: max 15 digits after +
  //   const digits = cleaned.slice(1);
  //   if (digits.length < 7 || digits.length > 15) {
  //     throw new Error("Invalid E.164 phone number length");
  //   }

  //   return `+${digits}`;
  // };


  // const hashPhoneNumber = async (phoneNumber: string): Promise<string> => {
  //     try {
  //       const hash = await Crypto.digestStringAsync(
  //         Crypto.CryptoDigestAlgorithm.SHA256,
  //         phoneNumber
  //       );
  //       return hash;
  //     } catch (error) {
  //       console.error('Error hashing phone number:', error);
  //       throw error;
  //     }
  //   };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');

    if (otpString.length !== OTP_LENGTH) {
      setError('Please enter all 6 digits');
      return;
    }

    console.log("========== OTP VERIFICATION DEBUG ==========");
    console.log("Phone for Supabase:", phoneForSupabase);
    console.log("OTP entered:", otpString);
    console.log("==========================================");

    setLoading(true);
    setError('');

    try {
      // Step 1: Verify OTP with Supabase
      console.log("Step 1: Verifying OTP with Supabase...");
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: phoneForSupabase,
        token: otpString,
        type: 'sms',
      });

      if (verifyError) {
        console.error("Supabase verification error:", verifyError);
        throw verifyError;
      }

      if (!data?.user?.id) {
        throw new Error('User ID not found after verification');
      }

      const userId = data.user.id;
      console.log("✅ OTP verified successfully! User ID:", userId);

      // Step 2: Update Redux state
      console.log("Step 2: Updating Redux state...");

      dispatch(setPhoneNumberVerified(true));
      dispatch(setUserId(userId));

      // Step 3: Get access token
      console.log("Step 3: Getting access token...");

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        console.error("No access token found");
        throw new Error('No access token found');
      }
      console.log("✅ Access token obtained");

      // Step 4: Check backend connectivity
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      console.log("Step 4: Backend URL:", backendUrl);

      if (!backendUrl) {
        console.error("EXPO_PUBLIC_BACKEND_URL not set!");
        throw new Error('Backend URL not configured. Please set EXPO_PUBLIC_BACKEND_URL in .env file');
      }

      // Step 5: Check if phone exists in backend
      console.log("Step 5: Checking phone in backend...");
      console.log("Phone for backend:", phoneForBackend);

      const normalized = normalizePhoneNumber(phoneForBackend);

      if (!normalized) {
        throw new Error('Failed to normalize phone number');
      }

      console.log("Normalized phone:", normalized);

      await debugPhoneNumber(phoneForBackend, 'OTP Screen');

      const phoneHash = await hashPhoneNumber(normalized);
      console.log("Phone hash:", phoneHash);

      // const checkResponse = await fetch(
      //   `${backendUrl}/auth/check-phone-number?phone=${encodeURIComponent(phoneHash)}`,
      //   {
      //     method: 'GET',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'Authorization': `Bearer ${accessToken}`,
      //     },
      //   }
      // );

      const checkResponse = await fetch(`${backendUrl}/auth/check-phone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ phone_hash: phoneHash }),
      });

      console.log("Backend check response status:", checkResponse.status);

      if (!checkResponse.ok) {
        const errorText = await checkResponse.text();
        console.error("Backend check failed:", errorText);
        throw new Error(`Backend check failed: ${checkResponse.status} - ${errorText}`);
      }

      const result = await checkResponse.json();
      console.log("Backend check result:", result);

      if (result.exists) {

        console.log("✅ User exists, navigating to Chats...");
        router.replace('/(tabs)/Chats');
      } else {

        // Step 6: Insert new phone number
        console.log("Step 6: Inserting new user in backend...");

        const insertResponse = await fetch(
          `${backendUrl}/auth/insert-phone`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              phone_hash: phoneHash,
              country_code: countryCode,
              user_id: userId,
              phone_verified: true
            }),
          }
        );

        console.log("Backend insert response status:", insertResponse.status);

        if (!insertResponse.ok) {

          const errorData = await insertResponse.json();
          console.error("Backend insert failed:", errorData);
          throw new Error(errorData.detail || 'Failed to insert phone number');
        }

        console.log("✅ User inserted, navigating to email...");
        router.replace('/(auth)/email');
      }

    } catch (err: any) {
      console.error('========== ERROR ==========');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      console.error('===========================');

      let errorMessage = 'Verification failed. Please try again.';

      if (err.message?.includes('expired')) {
        errorMessage = 'OTP has expired. Please request a new one.';
        setCanResend(true);
        setResendTimer(0);
      } else if (err.message?.includes('invalid') || err.message?.includes('Token')) {
        errorMessage = 'Invalid OTP. Please check the code and try again.';
      } else if (err.message?.includes('Network') || err.message?.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Check your internet connection.';
      } else if (err.message?.includes('Backend URL not configured')) {
        errorMessage = 'App not configured properly. Please contact support.';
      } else if (err.message?.includes('Backend')) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setResendTimer(RESEND_TIMER_SECONDS);
    setCanResend(false);
    clearOTP();
    setError('');

    console.log("Resending OTP to:", phoneForSupabase);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneForSupabase,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;

      Alert.alert('Success', 'A new OTP has been sent to your phone');
      console.log("✅ OTP resent successfully");

    } catch (err: any) {

      console.error("Resend OTP error:", err);
      Alert.alert('Error', err?.message || 'Failed to resend OTP');
      setCanResend(true);
      setResendTimer(0);
    }
  };

  const isOTPComplete = otp.every(digit => digit !== '');

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getActiveInputIndex = () => {
    const index = otp.findIndex(d => d === '');
    return index === -1 ? OTP_LENGTH - 1 : index;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
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
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Verify OTP</Text>
              <Text style={styles.subtitle}>
                OTP sent to {maskedPhoneNumber}
              </Text>
            </View>

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

            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                Check your SMS for the 6-digit code.{'\n'}
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
