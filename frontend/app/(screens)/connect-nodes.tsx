// app/connect-nodes.tsx
import React, { useState, useEffect } from 'react';
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
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Header from '@/components/Header';
import FloatingActionButton from '@/components/FloatingActionButton';

interface Contact {
  id: string;
  name: string;
  phone: string;
  hash: string;
  isRegistered: boolean;
  isSelected: boolean;
  avatarColor: string;
}

export default function ConnectNodesScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);

  // Generate avatar colors
  const avatarColors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#073B4C', '#7209B7'];

  // Normalize phone number
  const normalizePhoneNumber = (phoneNumber: string): string => {
    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    
    if (normalized.startsWith('0')) {
      normalized = normalized.substring(1);
    }
    
    if (!normalized.startsWith('+')) {
      if (normalized.length === 10) {
        normalized = '+91' + normalized;
      } else if (normalized.length === 12 && normalized.startsWith('91')) {
        normalized = '+' + normalized;
      }
    }
    
    return normalized;
  };

  // Hash phone number
  const hashPhoneNumber = async (phoneNumber: string): Promise<string> => {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        phoneNumber
      );
      return hash;
    } catch (error) {
      console.error('Error hashing phone number:', error);
      throw error;
    }
  };

  // Request contacts permission
  const requestContactsPermission = async () => {
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
            { text: 'Try Again', onPress: () => requestContactsPermission() }
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

  // Fetch and process contacts
  const fetchContacts = async () => {
    if (!permissionGranted) {
      const granted = await requestContactsPermission();
      if (!granted) return;
    }

    setLoading(true);

    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        const processedContacts: Contact[] = [];

        for (const contact of data) {
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            for (const phone of contact.phoneNumbers) {
              if (phone.number) {
                const normalizedPhone = normalizePhoneNumber(phone.number);
                
                if (normalizedPhone.length >= 10) {
                  const hash = await hashPhoneNumber(normalizedPhone);
                  
                  // Assign random color and registration status
                  const colorIndex = Math.floor(Math.random() * avatarColors.length);
                  const isRegistered = Math.random() > 0.5; // Simulate registration status
                  
                  processedContacts.push({
                    id: `${contact.id || 'contact'}-${Date.now()}-${Math.random()}`,
                    name: contact.name || 'Unknown',
                    phone: normalizedPhone,
                    hash: hash,
                    isRegistered: isRegistered,
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

        setContacts(uniqueContacts);
        
        // Filter to show only registered contacts for main list
        const registeredContacts = uniqueContacts.filter(contact => contact.isRegistered);
        setFilteredContacts(registeredContacts);

        // Send hashes to backend
        await sendToBackend(uniqueContacts.map(c => c.hash));
      } else {
        Alert.alert('No Contacts', 'No contacts found with phone numbers.');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      Alert.alert('Error', 'Failed to fetch contacts.');
    } finally {
      setLoading(false);
    }
  };

  // Send hashes to backend
  const sendToBackend = async (hashedPhoneNumbers: string[]) => {
    console.log('Sending hashes to backend:', hashedPhoneNumbers.length);
    // Add your backend API call here
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  };

  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    if (!contact.isRegistered) {
      // Show invite option for unregistered contacts
      Alert.alert(
        'Invite to App',
        `Invite ${contact.name} to join the app?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Send Invite', 
            onPress: () => handleInviteContact(contact)
          }
        ]
      );
      return;
    }

    const updatedContacts = contacts.map(c => 
      c.id === contact.id ? { ...c, isSelected: !c.isSelected } : c
    );
    setContacts(updatedContacts);

    // Update selected contacts list
    const isCurrentlySelected = contact.isSelected;
    if (isCurrentlySelected) {
      setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts(prev => [...prev, { ...contact, isSelected: true }]);
    }
  };

  // Handle invite contact
  const handleInviteContact = (contact: Contact) => {
    Alert.alert(
      'Invite Sent',
      `Invitation sent to ${contact.name}`,
      [{ text: 'OK' }]
    );
  };

  // Handle floating button action
  const handleFloatingButtonPress = () => {
    if (selectedContacts.length === 1) {
      // Start individual chat
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
              resetSelection();
            }
          }
        ]
      );
    }
  };

  // Reset all selections
  const resetSelection = () => {
    setContacts(prev => prev.map(c => ({ ...c, isSelected: false })));
    setSelectedContacts([]);
  };

  // Get floating button configuration
  const getFloatingButtonConfig = () => {
    if (selectedContacts.length === 0) {
      return { label: undefined, icon: 'add' as const, backgroundColor: '#1971c2' };
    } else if (selectedContacts.length === 1) {
      return { label: 'Message', icon: 'chatbubble' as const, backgroundColor: '#4CAF50' };
    } else {
      return { label: 'Group', icon: 'people' as const, backgroundColor: '#FF9800' };
    }
  };

  // Render contact item
  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleContactSelect(item)}
      activeOpacity={0.7}
    >
      {/* Avatar/Selection Circle */}
      <View style={[
        styles.avatarContainer,
        { backgroundColor: item.avatarColor },
        item.isRegistered && item.isSelected && styles.selectedAvatar,
      ]}>
        {item.isRegistered ? (
          <>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
            {item.isSelected && (
              <View style={styles.selectedCheckmark}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
            )}
          </>
        ) : (
          <Ionicons name="person-add-outline" size={24} color="white" />
        )}
      </View>

      {/* Contact Info */}
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
        {!item.isRegistered && (
          <Text style={styles.inviteLabel}>Invite to app</Text>
        )}
      </View>

      {/* Action Button for non-registered contacts */}
      {!item.isRegistered && (
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => handleInviteContact(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="send" size={18} color="#1971c2" />
          <Text style={styles.inviteButtonText}>Invite</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  // Generate unique key for each contact
  const getContactKey = (contact: Contact, index: number) => {
    return `${contact.id}-${index}`;
  };

  // Check permission on mount
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

  const floatingButtonConfig = getFloatingButtonConfig();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header 
        title="Connect Nodes"
        searchPlaceholder="Search contacts..."
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
          <Text style={styles.statNumber}>
            {contacts.filter(c => c.isRegistered).length}
          </Text>
          <Text style={styles.statLabel}>On App</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {selectedContacts.length}
          </Text>
          <Text style={styles.statLabel}>Selected</Text>
        </View>
      </View>

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
            keyExtractor={(item, index) => getContactKey(item, index)}
            contentContainerStyle={styles.contactsList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  All Contacts ({contacts.length})
                </Text>
                <TouchableOpacity
                  style={styles.syncButton}
                  onPress={fetchContacts}
                  disabled={syncing}
                >
                  {syncing ? (
                    <ActivityIndicator size="small" color="#1971c2" />
                  ) : (
                    <>
                      <Ionicons name="sync" size={16} color="#1971c2" />
                      <Text style={styles.syncButtonText}>Sync</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people" size={64} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No contacts found</Text>
                <Text style={styles.emptyStateText}>
                  Sync your contacts to find friends
                </Text>
                <TouchableOpacity
                  style={styles.syncContactsButton}
                  onPress={fetchContacts}
                  disabled={syncing}
                >
                  {syncing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="sync" size={20} color="white" />
                      <Text style={styles.syncContactsButtonText}>Sync Contacts</Text>
                    </>
                  )}
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
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  selectedAvatar: {
    borderWidth: 3,
    borderColor: '#1971c2',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  selectedCheckmark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1971c2',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  inviteLabel: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  inviteButton: {
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
  inviteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1971c2',
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