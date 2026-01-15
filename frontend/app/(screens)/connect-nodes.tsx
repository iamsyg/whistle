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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';

import Header from '@/components/Header';
import FloatingActionButton from '@/components/FloatingActionButton';
import UserCard from '@/components/UserCard';
import { setContacts, setContactsLoading } from '@/store/slices/contacts/contactsSlice';
import { Contact, MatchedContact } from '@/types/contact';
import { setConversation } from '@/store/slices/message/conversationSlice';
import { useSyncDeviceContacts } from '@/hooks/useSyncDeviceContacts';

export default function ConnectNodesScreen() {
  // const [loading, setLoading] = useState(true);
  // const [syncing, setSyncing] = useState(false);
  // const [permissionGranted, setPermissionGranted] = useState(false);

  const dispatch = useDispatch();
  // const contacts = useSelector((state: RootState) => state.contacts.all);

  const {
  syncDeviceContacts,
  loading,
  syncing,
  contacts
} = useSyncDeviceContacts();

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

  const handleFloatingButtonPress = useCallback(() => {
    if (selectedContacts.length === 1) {
      const contact = selectedContacts[0];

      if (!contact.profileId) {
        Alert.alert('Error', 'Cannot start chat. Contact not registered.');
        return;
      }

      Alert.alert(
        'Start Chat',
        `Start a chat with ${contact.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Chat',
            onPress: () => {
              console.log('Starting chat with:', contact.name, 'ID:', contact.profileId);

              // Clear selections
              dispatch(
                setContacts(contacts.map(c => ({ ...c, isSelected: false })))
              );

              dispatch(setConversation({
                contactProfileId: contact.profileId!,
              }))

              // Navigate with contactId
              router.push('/(screens)/chatScreen');
            }
          }
        ]
      );
    } else if (selectedContacts.length > 1) {
      // Create group chat
      Alert.alert(
        'Create Group',
        `Create a group chat with ${selectedContacts.length} people?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create Group',
            onPress: () => {
              console.log('Creating group with:', selectedContacts.map(c => c.name));
              // TODO: Implement group chat creation
              dispatch(
                setContacts(contacts.map(c => ({ ...c, isSelected: false })))
              );
              router.push('/(screens)/createGroup');
            }
          }
        ]
      );
    }
  }, [selectedContacts, contacts, dispatch]);

  const resetSelection = useCallback(() => {
    const selectedContact = selectedContacts[0]; // Get the selected contact

    // Clear selections in Redux
    dispatch(
      setContacts(contacts.map(c => ({ ...c, isSelected: false })))
    );



    // Navigate to chat screen with contactId
    if (selectedContact?.profileId) {
      console.log('Navigating to chat with contact ID:', selectedContact.profileId);

      dispatch(setConversation({
        contactProfileId: selectedContact.profileId
      }));

      router.push('/(screens)/chatScreen');
    } else {
      console.error('Selected contact has no profileId');
      router.push('/(screens)/chatScreen');
    }
  }, [contacts, selectedContacts, dispatch]);

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
    syncDeviceContacts();
  }, [syncDeviceContacts]);

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
                    onPress={syncDeviceContacts}
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
                  onPress={syncDeviceContacts}
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