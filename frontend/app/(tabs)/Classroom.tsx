// frontend/app/(tabs)/Classroom.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Modal,
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
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const dispatch = useDispatch();
  
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef<View>(null);

  const reduxEmails = useSelector(
    (state: RootState) => state.emailAuth.emails
  );

  const { emails, loading, error } = useGetUserGoogleEmails();

  useEffect(() => {
    if (emails.length > 0) {
      dispatch(setEmails(emails));
    }
  }, [emails, dispatch]);

  useEffect(() => {
    if (reduxEmails.length > 0 && !selectedEmail) {
      setSelectedEmail(reduxEmails[0]);
    }
  }, [reduxEmails]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (dropdownVisible) {
        setDropdownVisible(false);
      }
    };

    // This is a simplified approach - in a real app, you might want to use
    // Pressable or GestureHandler for better touch handling
    return () => {};
  }, [dropdownVisible]);

  const handleGoogleSignIn = async () => {
    if (isLoading || isAddingEmail) return;

    setIsLoading(true);
    setIsAddingEmail(true);
    console.log('🔘 Google Sign In button pressed');

    try {
      const { email, email_verified } = await signInWithGoogle();

      // Only do backend check, remove UI-level duplicate check
      await saveEmailToBackend(email, email_verified);
      
      dispatch(addEmail(email));
      
      // Set as selected email if it's the first one
      if (reduxEmails.length === 0) {
        setSelectedEmail(email);
      }

      Alert.alert('Success', 'Email linked successfully');

    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      if (error?.message?.includes('already exists') || 
          error?.response?.status === 409) {
        Alert.alert(
          'Email Already Linked',
          'This email is already attached to your account'
        );
      } else {
        Alert.alert(
          'Registration Failed',
          error?.message || 'Unable to link email. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
      setIsAddingEmail(false);
    }
  };

  const handleFloatingButtonPress = () => {
    if (reduxEmails.length === 0) {
      handleGoogleSignIn();
    } else {
      setDropdownVisible(!dropdownVisible);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {reduxEmails.length === 0 ? (
            <Text 
              style={[styles.addEmail, isAddingEmail && styles.disabledText]} 
              onPress={() => !isAddingEmail && handleGoogleSignIn()}
              disabled={isAddingEmail}
            >
              {isAddingEmail ? 'Adding...' : '+ Add email'}
            </Text>
          ) : (
            <View ref={dropdownRef}>
              <Text
                style={[styles.selectedEmail, isLoading && styles.disabledText]}
                onPress={() => !isLoading && setDropdownVisible(!dropdownVisible)}
                disabled={isLoading}
              >
                {selectedEmail} ⌄
              </Text>

              {dropdownVisible && (
                <View style={styles.dropdown}>
                  {reduxEmails.map((email) => (
                    <Text
                      key={email}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedEmail(email);
                        setDropdownVisible(false);
                      }}
                    >
                      {email}
                    </Text>
                  ))}

                  <View style={styles.divider} />

                  <Text
                    style={[styles.dropdownItem, styles.addMore]}
                    onPress={() => {
                      setDropdownVisible(false);
                      handleGoogleSignIn();
                    }}
                    disabled={isAddingEmail}
                  >
                    {isAddingEmail ? 'Adding...' : '+ Add another email'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

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
          iconName="logo-google"
          backgroundColor={isLoading || isAddingEmail ? '#ccc' : '#EA4335'}
          onPress={handleFloatingButtonPress}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  header: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 100,
  },
  selectedEmail: {
    fontSize: 14,
    color: '#1971c2',
    fontWeight: '600',
    padding: 8,
  },
  addEmail: {
    fontSize: 14,
    color: '#EA4335',
    fontWeight: '600',
    padding: 8,
  },
  disabledText: {
    opacity: 0.5,
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingVertical: 8,
    minWidth: 220,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#333',
  },
  addMore: {
    color: '#EA4335',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 6,
  },
});