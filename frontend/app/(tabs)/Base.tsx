// frontend/app/(tabs)/Base.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import FloatingActionButton from '@/components/FloatingActionButton';
import { signInWithGoogle } from '@/services/auth/signInWithGoogle';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { saveEmailToBackend } from '@/hooks/saveEmailToBackend';
import { addEmail, setEmails, setSelectedEmail } from '@/store/slices/auth/emailAuthSlice';
import { useGetUserGoogleEmails } from '@/hooks/useGetUserGoogleId';
import { useRouter } from 'expo-router';
import ModalMenu, { MenuItem } from '@/components/ModalMenu';
import useGetUserAllClassroom from '@/hooks/useGetUserAllClassroom';
import { Ionicons } from '@expo/vector-icons'; // Added import

export default function BaseScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef<View>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const selectedEmail = useSelector(
    (state: RootState) => state.emailAuth.selectedEmail
  );

  const reduxEmails = useSelector(
    (state: RootState) => state.emailAuth.emails
  );

  const classrooms = useSelector((state: RootState) =>
    Object.values(state.classroom.classrooms)
  );

  console.log('🔘 Classrooms:', classrooms);
  console.log('🔘 Selected Email:', selectedEmail);

  const { emails, loading, error } = useGetUserGoogleEmails();
  const { loading: classroomLoading, error: classroomError } = useGetUserAllClassroom(selectedEmail);

  useEffect(() => {
    if (emails.length > 0) {
      dispatch(setEmails(emails));
    }
  }, [emails, dispatch]);

  useEffect(() => {
    if (reduxEmails.length > 0 && !selectedEmail) {
      dispatch(setSelectedEmail(reduxEmails[0]));
    }
  }, [reduxEmails, selectedEmail, dispatch]);

  const handleGoogleSignIn = async () => {
    if (isLoading || isAddingEmail) return;

    setIsLoading(true);
    setIsAddingEmail(true);
    console.log('🔘 Google Sign In button pressed');

    try {
      const { email, google_name, email_verified } = await signInWithGoogle();

      // Only do backend check, remove UI-level duplicate check
      await saveEmailToBackend(email, google_name, email_verified);

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
    setIsMenuVisible(false);
  };

  const handleJoinClassroom = () => {
    router.push("/(screens)/joinClassroom");
    setIsMenuVisible(false);
  };

  const closeAllMenus = () => {
    setDropdownVisible(false);
    setIsMenuVisible(false);
  };

  // Handle classroom navigation when a classroom is pressed
  const handleClassroomPress = (chat_id: string) => {
    router.push(`/(screens)/classroomScreen`);
  };

  // Render classroom item
  const renderClassroomItem = ({ item }: { item: any }) => (
    <TouchableWithoutFeedback onPress={() => handleClassroomPress(item.chat_id)}>
      <View style={styles.classroomCard}>
        {/* Avatar */}
        <View style={styles.classroomAvatar}>
          <Text style={styles.avatarText}>
            {item.title.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.classroomInfo}>
          <Text style={styles.classroomTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={styles.classroomMeta}>
            By {item.creator.google_name || 'Unknown'}
          </Text>

          <Text style={styles.classroomDate}>
            Created on{' '}
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="school-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No bases yet</Text>
      <Text style={styles.emptySubtitle}>
        Create or join a base to get started.
      </Text>
    </View>
  );

  console.log('🔘 Selected Email:', selectedEmail);

  const menuItems: MenuItem[] = [
    {
      id: 1,
      label: 'Create Base',
      icon: 'create-outline',
      onPress: handleCreateClassroom,
    },
    {
      id: 2,
      label: 'Join Base',
      icon: 'enter-outline',
      onPress: handleJoinClassroom,
    },
  ];

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
          {classroomLoading ? (
            <ActivityIndicator size="large" color="#6f42c1" />
          ) : (
            <FlatList
              data={classrooms}
              keyExtractor={(item) => item.chat_id}
              renderItem={renderClassroomItem}
              ListEmptyComponent={renderEmptyState}
              contentContainerStyle={classrooms.length === 0 ? styles.emptyContainer : styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
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
    paddingTop: 60, // Make room for the header
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
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  classroomCard: {
    // flexDirection: 'row',
    // padding: 14,
    // borderRadius: 12,
    // backgroundColor: '#f8f6ff',
    // marginBottom: 12,
    // alignItems: 'center',
    // borderWidth: 1,
    // borderColor: '#e9e5ff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  classroomAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6f42c1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  classroomInfo: {
    flex: 1,
  },
  classroomTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d1e5f',
    marginBottom: 4,
  },
  classroomMeta: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  classroomDate: {
    fontSize: 12,
    color: '#777',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});