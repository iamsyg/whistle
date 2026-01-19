// frontend/app/(tabs)/Classroom.tsx

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import FloatingActionButton from '@/components/FloatingActionButton';
import { signInWithGoogle } from '@/services/auth/signInWithGoogle';
// import { checkUserGoogleAuth } from '@/services/auth/signInWithGoogle';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setEmail, setEmailVerified } from '@/store/slices/auth/emailAuthSlice';
import { saveEmailToBackend } from '@/hooks/saveEmailToBackend';


export default function ClassroomScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  // useEffect(() => {
  //   checkUserGoogleAuth();
  // }, []);

  const handleGoogleSignIn = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    console.log('🔘 Google Sign In button pressed');

    try {
      const {email, email_verified} = await signInWithGoogle();

      dispatch(setEmail(email));
      dispatch(setEmailVerified(email_verified));

      await saveEmailToBackend(email, email_verified);

    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      Alert.alert(
        'Sign In Error',
        error.message || 'Failed to sign in with Google. Please try again.',
        [{ text: 'OK' }]
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
            <Text style={styles.loadingText}>Signing in with Google...</Text>
          </View>
        )}
      </View>
      
      <FloatingActionButton
        onPress={handleGoogleSignIn}
        iconName="logo-google"
        backgroundColor={isLoading ? "#ccc" : "#EA4335"}
      
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