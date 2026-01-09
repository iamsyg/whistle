// components/UserCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedConversationId } from '@/store/slices/message/conversationSlice';
import { RootState } from '@/store/store';
import { Contact } from '@/types/contact';

// export interface Contact {
//   contactId: string;      // local/contact/hash id
//   profileId?: string;     // UUID from backend (ONLY if registered)
//   name: string;
//   phone: string;
//   hash: string;
//   isRegistered: boolean;
//   isSelected: boolean;
//   avatarColor: string;
// }

interface UserCardProps {
  contact: Contact;
  onPress: (contact: Contact) => void;
  onInvite: (contact: Contact) => void;
}

const UserCard: React.FC<UserCardProps> = ({ contact, onPress, onInvite }) => {

  const dispatch = useDispatch();




  const handlePress = () => {

  if (!contact.isRegistered) return;

  onPress(contact); // let parent handle selection
};

  return (
    <TouchableOpacity
      style={styles.contactItem}
      activeOpacity={0.7}
      onPress={() => {
        if (!contact.isRegistered) return;
        onPress(contact);
        handlePress();
      }}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatarContainer,
          { backgroundColor: contact.avatarColor },
          contact.isRegistered && contact.isSelected && styles.selectedAvatar,
        ]}
      >
        {contact.isRegistered ? (
          <>
            <Text style={styles.avatarText}>
              {contact.name.charAt(0).toUpperCase()}
            </Text>

            {contact.isSelected && (
              <View style={styles.selectedCheckmark}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
            )}
          </>
        ) : (
          <Ionicons name="person-add-outline" size={24} color="white" />
        )}
      </View>

      {/* Info */}
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactPhone}>{contact.phone}</Text>
        {!contact.isRegistered && (
          <Text style={styles.inviteLabel}>Invite to app</Text>
        )}
      </View>

      {/* Invite button */}
      {!contact.isRegistered && (
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => onInvite(contact)}
        >
          <Ionicons name="send" size={18} color="#1971c2" />
          <Text style={styles.inviteButtonText}>Invite</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({

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

export default UserCard


