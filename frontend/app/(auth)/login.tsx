import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhoneInput from '../../components/PhoneInput';
import { CountryCode } from '../../constants/countryCodes';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhoneNumber = (): boolean => {
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }

    if (phoneNumber.length < 10) {
      setError('Phone number must be at least 10 digits');
      return false;
    }

    if (!/^\d+$/.test(phoneNumber)) {
      setError('Phone number must contain only digits');
      return false;
    }

    setError('');
    return true;
  };

  // Replace the Alert.alert section with navigation
const handleSendOTP = async () => {
  if (!validatePhoneNumber()) {
    return;
  }

  setLoading(true);
  setError('');

  try {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Navigate to OTP screen with phone number
    router.push({
      pathname: '/(auth)/otp',
      params: {
        phoneNumber: phoneNumber,
        maskedPhoneNumber: `+91 *****${phoneNumber.slice(-4)}`,
      },
    });
    
  } catch (err) {
    setError('Failed to send OTP. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleCountryCodeChange = (country: CountryCode) => {
    setCountryCode(country);
  };

  const fullPhoneNumber = `${countryCode?.dial_code || '+91'}${phoneNumber}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Verify Phone Number</Text>
              <Text style={styles.subtitle}>
                Enter your phone number to receive a verification code
              </Text>
            </View>

            <View style={styles.form}>
              <PhoneInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                onCountryCodeChange={handleCountryCodeChange}
                placeholder="Enter phone number"
                error={error}
                disabled={loading}
                autoFocus
              />

              <Text style={styles.previewText}>
                We'll send OTP to: {fullPhoneNumber}
              </Text>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
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
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
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
  form: {
    flex: 1,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1971c2',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#a5d8ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});