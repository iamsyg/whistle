// app/(screens)/connect-nodes.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';

import Header from '@/components/Header';
import FloatingActionButton from '@/components/FloatingActionButton';
import UserCard from '@/components/UserCard';
import { supabase } from '@/utils/supabase';
import { normalizePhoneNumber, hashPhoneNumber, debugPhoneNumber } from '@/utils/phoneUtils';
import { getDeviceCountryDialCode } from '@/utils/countryCode';
import { setContacts, setContactsLoading } from '@/store/slices/contacts/contactsSlice';
import { RootState } from '@/store/store';
import { Contact, MatchedContact } from '@/types/contact';

export default function ConnectNodesScreen() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const dispatch = useDispatch();
  const contacts = useSelector((state: RootState) => state.contacts.all);
  
  // ✅ Memoized to prevent unnecessary recalculations
  const selectedContacts = useMemo(
    () => contacts.filter(c => c.isSelected),
    [contacts]
  );

  const registeredContacts = useMemo(
    () => contacts.filter(c => c.isRegistered),
    [contacts]
  );

  // Avatar colors
  const avatarColors = useMemo(() => [
    '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', 
    '#118AB2', '#EF476F', '#073B4C', '#7209B7'
  ], []);

  // ✅ Request contacts permission
  const requestContactsPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
        return true;
      } else {
        Alert.alert(
          'Permission Denied',
          'Contacts permission is required to find friends.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
            { text: 'Try Again', onPress: requestContactsPermission }
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      Alert.alert('Error', 'Failed to request contacts permission.');
      return false;
    }
  };

  // ✅ Send hashes to backend with improved error handling
  const sendToBackend = async (hashedPhoneNumbers: string[]) => {
    console.log('Sending hashes to backend:', hashedPhoneNumbers.length);

    if (hashedPhoneNumbers.length === 0) {
      console.log('No valid contacts to match, skipping backend call');
      return { success: true, data: { matched_contacts: [], count: 0 } };
    }

    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      console.error('EXPO_PUBLIC_BACKEND_URL not set!');
      Alert.alert('Configuration Error', 'Backend URL not configured.');
      return { success: false };
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        console.error('No access token found');
        Alert.alert('Authentication Error', 'Please log in again.');
        router.replace('/(auth)/login');
        return { success: false };
      }

      console.log('Fetching from:', `${backendUrl}/contacts/match-contacts`);
      const response = await fetch(`${backendUrl}/contacts/match-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ phone_hashes: hashedPhoneNumbers }),
      });

      console.log('Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend response error:', errorText);
        
        // ✅ Better error messaging
        if (response.status === 401) {
          Alert.alert('Session Expired', 'Please log in again.');
          router.replace('/(auth)/login');
        } else {
          Alert.alert('Sync Error', 'Failed to match contacts. Please try again.');
        }
        return { success: false };
      }

      const data = await response.json();
      console.log('Matched contacts:', data.count);
      return { success: true, data };
    } catch (error) {
      console.error('Backend request error:', error);
      Alert.alert(
        'Connection Error',
        'Cannot connect to server. Please check your internet connection.'
      );
      return { success: false };
    }
  };

  // ✅ Fetch and process contacts
  const fetchContacts = async () => {
    if (!permissionGranted) {
      const granted = await requestContactsPermission();
      if (!granted) return;
    }

    setSyncing(true);
    setLoading(true);
    dispatch(setContactsLoading(true));

    try {
      const defaultCountryCode = getDeviceCountryDialCode();
      console.log('Using default country code:', defaultCountryCode);

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        const processedContacts: Contact[] = [];

        for (const contact of data) {
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            for (const phone of contact.phoneNumbers) {
              if (phone.number) {
                const normalizedPhone = normalizePhoneNumber(phone.number, defaultCountryCode);
                
                if (!normalizedPhone) {
                  console.log('Skipping invalid phone:', phone.number);
                  continue;
                }

                // Debug first contact
                if (processedContacts.length === 0) {
                  await debugPhoneNumber(phone.number, 'Connect Nodes - First Contact', defaultCountryCode);
                }

                if (normalizedPhone.length >= 10) {
                  const hash = await hashPhoneNumber(normalizedPhone);
                  const colorIndex = Math.floor(Math.random() * avatarColors.length);

                  processedContacts.push({
                    contactId: `${contact.id}-${hash}`,
                    name: contact.name || 'Unknown',
                    phone: normalizedPhone,
                    hash,
                    isRegistered: false,
                    isSelected: false,
                    avatarColor: avatarColors[colorIndex],
                  });
                }
              }
            }
          }
        }

        // Remove duplicates based on hash
        const uniqueContacts = processedContacts.filter(
          (contact, index, self) =>
            index === self.findIndex((c) => c.hash === contact.hash)
        );

        console.log('Total unique contacts:', uniqueContacts.length);

        // Send hashes to backend
        const backendResponse = await sendToBackend(
          uniqueContacts.map(c => c.hash)
        );

        if (!backendResponse?.success) {
          console.warn('Backend match failed - showing unmatched contacts');
          dispatch(setContacts(uniqueContacts));
          return;
        }

        const matchedContacts = backendResponse.data.matched_contacts as MatchedContact[];
        const matchedMap = new Map(
          matchedContacts.map(u => [u.phone_number_hash, u.id])
        );

        console.log('Matched hashes count:', matchedMap.size);

        // Update contacts with registration status
        const finalContacts: Contact[] = uniqueContacts.map(c => ({
          ...c,
          isRegistered: matchedMap.has(c.hash),
          profileId: matchedMap.get(c.hash),
        }));

        dispatch(setContacts(finalContacts));
        console.log('Registered contacts:', finalContacts.filter(c => c.isRegistered).length);
      } else {
        Alert.alert('No Contacts', 'No contacts found with phone numbers.');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      Alert.alert('Error', 'Failed to fetch contacts.');
    } finally {
      setSyncing(false);
      setLoading(false);
      dispatch(setContactsLoading(false));
    }
  };

  // ✅ Handle contact selection
  const handleContactSelect = useCallback((contact: Contact) => {
    if (!contact.isRegistered) {
      Alert.alert(
        'Invite to App',
        `Invite ${contact.name} to join the app?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send Invite', onPress: () => handleInviteContact(contact) }
        ]
      );
      return;
    }

    const updatedContacts = contacts.map(c =>
      c.contactId === contact.contactId ? { ...c, isSelected: !c.isSelected } : c
    );
    dispatch(setContacts(updatedContacts));
  }, [contacts, dispatch]);

  // ✅ Handle invite contact
  const handleInviteContact = useCallback((contact: Contact) => {
    Alert.alert(
      'Invite Sent',
      `Invitation sent to ${contact.name}`,
      [{ text: 'OK' }]
    );
  }, []);

  // ✅ Handle floating button action
  const handleFloatingButtonPress = useCallback(() => {
    if (selectedContacts.length === 1) {
      const contact = selectedContacts[0];
      Alert.alert(
        'Start Chat',
        `Start a chat with ${contact.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Chat',
            onPress: () => {
              console.log('Starting chat with:', contact.name);
              resetSelection();
            }
          }
        ]
      );
    } else if (selectedContacts.length > 1) {
      Alert.alert(
        'Create Group',
        `Create a group chat with ${selectedContacts.length} people?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create Group',
            onPress: () => {
              console.log('Creating group with:', selectedContacts.map(c => c.name));
              resetSelection();
            }
          }
        ]
      );
    }
  }, [selectedContacts]);

  // ✅ Reset selection
  const resetSelection = useCallback(() => {
    dispatch(
      setContacts(contacts.map(c => ({ ...c, isSelected: false })))
    );
    router.push('/(screens)/chatScreen');
  }, [contacts, dispatch]);

  // ✅ Clear all selections
  const clearAllSelections = useCallback(() => {
    dispatch(
      setContacts(contacts.map(c => ({ ...c, isSelected: false })))
    );
  }, [contacts, dispatch]);

  // ✅ Get floating button configuration
  const floatingButtonConfig = useMemo(() => {
    if (selectedContacts.length === 0) {
      return {
        label: undefined,
        icon: 'add' as const,
        backgroundColor: '#1971c2'
      };
    } else if (selectedContacts.length === 1) {
      return {
        label: 'Message',
        icon: 'chatbubble' as const,
        backgroundColor: '#4CAF50'
      };
    } else {
      return {
        label: 'Group',
        icon: 'people' as const,
        backgroundColor: '#FF9800'
      };
    }
  }, [selectedContacts.length]);

  // ✅ Render contact item
  const renderContactItem = useCallback(({ item }: { item: Contact }) => (
    <UserCard
      contact={item}
      onPress={() => handleContactSelect(item)}
      onInvite={() => handleInviteContact(item)}
    />
  ), [handleContactSelect, handleInviteContact]);

  // ✅ Check permission on mount
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { status } = await Contacts.getPermissionsAsync();
    setPermissionGranted(status === 'granted');
    if (status === 'granted') {
      await fetchContacts();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        title="Connect Nodes"
        onSearch={(query) => console.log('Search contacts:', query)}
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{contacts.length}</Text>
          <Text style={styles.statLabel}>Total Contacts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{registeredContacts.length}</Text>
          <Text style={styles.statLabel}>On App</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{selectedContacts.length}</Text>
          <Text style={styles.statLabel}>Selected</Text>
        </View>
      </View>

      {/* ✅ Selected Count Bar */}
      {/* {selectedContacts.length > 0 && (
        <View style={styles.selectedCountContainer}>
          <Text style={styles.selectedCountText}>
            {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity
            style={styles.clearSelectionButton}
            onPress={clearAllSelections}
          >
            <Text style={styles.clearSelectionText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )} */}

      {/* Contacts List */}
      <View style={styles.contactsSection}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1971c2" />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            renderItem={renderContactItem}
            keyExtractor={item => item.contactId}
            contentContainerStyle={styles.contactsList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  All Contacts ({contacts.length})
                </Text>
                {syncing ? (
                  <ActivityIndicator size="small" color="#1971c2" />
                ) : (
                  <TouchableOpacity
                    style={styles.syncButton}
                    onPress={fetchContacts}
                  >
                    <Ionicons name="refresh" size={14} color="#1971c2" />
                    <Text style={styles.syncButtonText}>Sync</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No contacts found</Text>
                <Text style={styles.emptyStateText}>
                  Sync your contacts to find friends
                </Text>
                <TouchableOpacity
                  style={styles.syncContactsButton}
                  onPress={fetchContacts}
                >
                  <Ionicons name="sync" size={20} color="white" />
                  <Text style={styles.syncContactsButtonText}>
                    Sync Contacts
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={selectedContacts.length > 0 ? handleFloatingButtonPress : undefined}
        href={selectedContacts.length === 0 ? undefined : undefined}
        iconName={floatingButtonConfig.icon}
        backgroundColor={floatingButtonConfig.backgroundColor}
        size={56}
        bottom={30}
        right={24}
        label={floatingButtonConfig.label}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1971c2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  selectedCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E6F4FE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#1971c2',
    fontWeight: '500',
  },
  clearSelectionButton: {
    padding: 6,
  },
  clearSelectionText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  contactsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1971c2',
    gap: 4,
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1971c2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  contactsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  syncContactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1971c2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  syncContactsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});