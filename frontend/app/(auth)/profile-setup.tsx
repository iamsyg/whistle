import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface ProfileData {
  email: string;
  username: string;
}

interface ValidationErrors {
  email?: string;
  username?: string;
}

export default function ProfileSetupScreen() {
  const [profile, setProfile] = useState<ProfileData>({
    email: '',
    username: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isFormValid, setIsFormValid] = useState(true);
  
  const emailInputRef = useRef<TextInput>(null);
  const usernameInputRef = useRef<TextInput>(null);

  // Validate email format
  const validateEmail = (email: string): string | undefined => {
    if (email.trim() === '') return undefined; // Empty is okay since optional
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  // Validate username format
  const validateUsername = (username: string): string | undefined => {
    if (username.trim() === '') return undefined; // Empty is okay since optional
    
    if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    
    if (username.length > 30) {
      return 'Username must be less than 30 characters';
    }
    
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    
    return undefined;
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    const emailError = validateEmail(profile.email);
    if (emailError) newErrors.email = emailError;
    
    const usernameError = validateUsername(profile.username);
    if (usernameError) newErrors.username = usernameError;
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsFormValid(isValid);
    
    return isValid;
  };

  // Handle input changes
  const handleInputChange = (field: keyof ProfileData, value: string) => {
    let processedValue = value;
    
    // Auto lowercase username
    if (field === 'username') {
      processedValue = value.toLowerCase();
    }
    
    const newProfile = { ...profile, [field]: processedValue };
    setProfile(newProfile);
    
    // Clear error for this field when user types
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
      setIsFormValid(Object.keys(newErrors).length === 0);
    }
  };

  // Handle Continue button press
  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    router.replace('/(auth)/profile-details');

    try {
      // Simulate API call to save profile
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, you would make an actual API call here
      // await api.saveProfile(profile);
      
      console.log('Profile saved:', profile);
      
      // Navigate to home screen
      // Replace the navigation in handleContinue and handleSkip
      router.replace('/(auth)/profile-details');
      
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to save profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Skip button press
  // const handleSkip = () => {
  //   Alert.alert(
  //     'Skip Profile Setup',
  //     'You can update your profile later from settings. Continue without adding information?',
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       { 
  //         text: 'Continue', 
  //         style: 'default',
  //         onPress: () => router.replace('/(auth)/profile-details')
  //       },
  //     ]
  //   );
  // };

  // Auto-focus email input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Move focus to next input
  const focusNextInput = () => {
    if (usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  };

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
              {/* <View style={styles.progressIndicator}>
                <View style={styles.progressDot} />
                <View style={styles.progressLine} />
                <View style={[styles.progressDot, styles.progressDotActive]} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
              </View> */}
              
              <Text style={styles.title}>Set up your profile</Text>
              <Text style={styles.subtitle}>
                You can add these now or skip for later
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <Text style={styles.optionalText}>Optional</Text>
                </View>
                <TextInput
                  ref={emailInputRef}
                  style={[
                    styles.input,
                    errors.email && styles.inputError,
                    profile.email && styles.inputFilled,
                  ]}
                  value={profile.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  placeholder="Email (optional)"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={focusNextInput}
                  editable={!loading}
                />
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : (
                  <Text style={styles.helperText}>
                    We'll use this for important updates
                  </Text>
                )}
              </View>

              {/* Username Input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <Text style={styles.optionalText}>Optional</Text>
                </View>
                <TextInput
                  ref={usernameInputRef}
                  style={[
                    styles.input,
                    errors.username && styles.inputError,
                    profile.username && styles.inputFilled,
                  ]}
                  value={profile.username}
                  onChangeText={(text) => handleInputChange('username', text)}
                  placeholder="Username (optional)"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  editable={!loading}
                />
                {errors.username ? (
                  <Text style={styles.errorText}>{errors.username}</Text>
                ) : (
                  <View style={styles.usernameHelper}>
                    <Text style={styles.helperText}>
                      This will be visible to others
                    </Text>
                    {profile.username && (
                      <Text style={styles.lowercaseText}>
                        Displayed as: @{profile.username.toLowerCase()}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Form Validation Summary */}
              {!isFormValid && (
                <View style={styles.validationSummary}>
                  <Text style={styles.validationSummaryText}>
                    Please fix the errors above to continue
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    (!isFormValid || loading) && styles.continueButtonDisabled,
                  ]}
                  onPress={handleContinue}
                  disabled={!isFormValid || loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.continueButtonText}>Continue/Skip</Text>
                  )}
                </TouchableOpacity>

                {/* <TouchableOpacity
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
                </TouchableOpacity> */}
              </View>
            </View>

            {/* Footer Info */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                You can update your profile anytime from the settings screen
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
//   progressIndicator: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   progressDot: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#dee2e6',
//   },
//   progressDotActive: {
//     backgroundColor: '#1971c2',
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//   },
//   progressLine: {
//     width: 40,
//     height: 2,
//     backgroundColor: '#dee2e6',
//   },
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
  inputGroup: {
    marginBottom: 28,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionalText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  helperText: {
    color: '#666',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  usernameHelper: {
    marginTop: 6,
  },
  lowercaseText: {
    color: '#1971c2',
    fontSize: 14,
    marginTop: 2,
    marginLeft: 4,
    fontWeight: '500',
  },
  validationSummary: {
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ffc9c9',
  },
  validationSummaryText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  actions: {
    marginTop: 8,
  },
  continueButton: {
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
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#a5d8ff',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // skipButton: {
  //   paddingVertical: 12,
  //   alignItems: 'center',
  // },
  // skipButtonText: {
  //   fontSize: 16,
  //   color: '#1971c2',
  //   fontWeight: '600',
  // },
  // skipButtonDisabled: {
  //   color: '#a5d8ff',
  // },
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