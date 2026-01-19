// frontend/app/(tabs)/Classroom.tsx

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import FloatingActionButton from '@/components/FloatingActionButton';
import { signInWithGoogle } from '@/services/auth/signInWithGoogle';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { saveEmailToBackend } from '@/hooks/saveEmailToBackend';
import { addEmail, setEmails } from '@/store/slices/auth/emailAuthSlice';
import { useGetUserGoogleEmails } from '@/hooks/useGetUserGoogleId';

export default function ClassroomScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const reduxEmails = useSelector(
    (state: RootState) => state.emailAuth.emails
  );

  const { emails, loading, error } = useGetUserGoogleEmails();

  useEffect(() => {
    if (emails.length > 0) {
      dispatch(setEmails(emails));
    }
  }, [emails, dispatch]);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    setIsLoading(true);
    console.log('🔘 Google Sign In button pressed');

    try {
      const { email, email_verified } = await signInWithGoogle();

      console.log('📝 Retrieved email:', reduxEmails);

      // UI-level safety (optional)
      if (reduxEmails.includes(email)) {
        Alert.alert('Already linked', 'This email is already attached');
        setIsLoading(false); // ✅ reset manually
        return;
      }

      await saveEmailToBackend(email, email_verified);

      dispatch(addEmail(email));

      Alert.alert('Success', 'Email linked successfully');

    } catch (error: any) {
      Alert.alert(
        'Registration',
        error?.message === 'Email already exists'
          ? 'User already registered with this ID'
          : 'Not in service'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>
          You've successfully set up your account.
        </Text>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#EA4335" />
            <Text style={styles.loadingText}>
              Signing in with Google...
            </Text>
          </View>
        )}
      </View>

      <FloatingActionButton
        onPress={handleGoogleSignIn}
        iconName="logo-google"
        backgroundColor={isLoading ? '#ccc' : '#EA4335'}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1971c2',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});