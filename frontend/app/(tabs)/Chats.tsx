// app/(tabs)/Chats.tsx

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { router } from 'expo-router';
import FloatingActionButton from '@/components/FloatingActionButton';
import useGetUserAllChats from '@/hooks/useGetUserAllChats';
import { setConversation } from '@/store/slices/message/conversationSlice';
import { UserConversation } from '@/types/conversation';

export default function ChatsScreen() {
  const dispatch = useDispatch();

  const { loading } = useGetUserAllChats();

  const conversations = useSelector(
    (state: RootState) => state.conversation.userAllConversations
  );

  const contactsByProfileId = useSelector(
    (state: RootState) => state.contacts.byProfileId
  );

  console.log("contactsByProfileId:", contactsByProfileId); 

  const renderItem = ({ item }: { item: UserConversation }) => {

    if(!item.other_user) return null; // Safety check
    const otherUser = item.other_user;

    // ✅ WhatsApp logic
    const savedContact = contactsByProfileId[otherUser.id];

    // const displayName =
    //   savedContact?.name ||
    //   otherUser.name ||
    //   otherUser.username ||
    //   'Unknown';

    let displayName = '';

    if (savedContact) {
        displayName = savedContact.name;
    } else {
        const phoneNumber = otherUser.phone_number || "Unknown";
        const backendName = otherUser.name || otherUser.username;

        if (backendName) {
            displayName = `${phoneNumber} ~ ${backendName}`;
        } else {
            displayName = phoneNumber;
        }

    }

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          dispatch(
            setConversation({
              contactProfileId: otherUser.id,
              conversationId: item.chat_id,
            })
          );
          router.push('/(screens)/chatScreen');
        }}
      >
        {/* Avatar */}
        <View style={[
            styles.avatar, 
            { backgroundColor: savedContact?.avatarColor || '#ccc' }
        ]}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase().replace('+', '')}
          </Text>
        </View>

        {/* Chat info */}
        <View style={styles.chatInfo}>
          <Text style={styles.chatName} numberOfLines={1}>{displayName}</Text>

          {item.last_message && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.last_message.content}
            </Text>
          )}
        </View>

        {/* Time */}
        {item.last_message?.created_at && (
          <Text style={styles.time}>
            {new Date(item.last_message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No chats yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a conversation to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.chat_id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <FloatingActionButton
        href="/(screens)/connect-nodes"
        iconName="add"
        backgroundColor="#1971c2"
        size={56}
        bottom={30}
        right={24}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    paddingVertical: 10,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  time: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
  },
});