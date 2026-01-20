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
} from 'react-native';
import FloatingActionButton from '@/components/FloatingActionButton';
import { signInWithGoogle } from '@/services/auth/signInWithGoogle';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { saveEmailToBackend } from '@/hooks/saveEmailToBackend';
import { addEmail, setEmails, setSelectedEmail } from '@/store/slices/auth/emailAuthSlice';
import { useGetUserGoogleEmails } from '@/hooks/useGetUserGoogleId';
import { useRouter } from 'expo-router';
import ModalMenu, {MenuItem} from '@/components/ModalMenu';

export default function ClassroomScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  
  // const [selectedEmail, dispatch(setSelectedEmail] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef<View>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const selectedEmail = useSelector(
    (state: RootState) => state.emailAuth.selectedEmail
  );

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
      dispatch(setSelectedEmail(reduxEmails[0]));
    }
  }, [reduxEmails]);

  // Close dropdown when clicking outside
  // useEffect(() => {
  //   const handleClickOutside = () => {
  //     if (dropdownVisible) {
  //       setDropdownVisible(false);
  //     }
  //   };

  //   // This is a simplified approach - in a real app, you might want to use
  //   // Pressable or GestureHandler for better touch handling
  //   return () => {};
  // }, [dropdownVisible]);

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
      dispatch(setSelectedEmail(email));

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
    // Check if user has at least one email linked
    if (reduxEmails.length === 0) {
      Alert.alert(
        'Email Required',
        'Please add an email first to create or join a classroom',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Email', onPress: handleGoogleSignIn }
        ]
      );
      return;
    }
    
    // Toggle menu visibility
    setIsMenuVisible(!isMenuVisible);
  };

  const handleCreateClassroom = () => {
    router.push("/(screens)/createClassroom");
  };

  const handleJoinClassroom = () => {
    router.push("/(screens)/joinClassroom");
  };

  console.log('🔘 Selected Email:', selectedEmail);

  const menuItems: MenuItem[] = [
    {
      id: 1,
      label: 'Create Organization',
      icon: 'create-outline',
      onPress: handleCreateClassroom,
    },
    {
      id: 2,
      label: 'Join Organization',
      icon: 'enter-outline',
      onPress: handleJoinClassroom,
    },
  ];

  const closeAllMenus = () => {
    setDropdownVisible(false);
    setIsMenuVisible(false);
  };

  return (
    <TouchableWithoutFeedback onPress={closeAllMenus}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {reduxEmails.length === 0 ? (
            <Text 
              style={[styles.addEmail, isAddingEmail && styles.disabledText]} 
              onPress={() => !isAddingEmail && handleGoogleSignIn()}
            >
              {isAddingEmail ? 'Adding...' : '+ Add email'}
            </Text>
          ) : (
            <View ref={dropdownRef}>
              <Text
                style={[styles.selectedEmail, isLoading && styles.disabledText]}
                onPress={() => !isLoading && setDropdownVisible(!dropdownVisible)}
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
                        dispatch(setSelectedEmail(email));
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

        {/* Modal Menu */}
        <ModalMenu
          visible={isMenuVisible}
          onClose={() => setIsMenuVisible(false)}
          menuItems={menuItems}
          menuWidth={220}
        />

        <FloatingActionButton
          iconName={isMenuVisible ? "close" : "add"}
          backgroundColor={isLoading || isAddingEmail ? '#ccc' : '#1971c2'}
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