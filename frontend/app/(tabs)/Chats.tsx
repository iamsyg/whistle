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

  const renderItem = ({ item }: any) => {
    const otherUser = item.other_user;

    // ✅ WhatsApp logic
    const savedContact = contactsByProfileId[otherUser.id];

    const displayName =
      savedContact?.name ||
      otherUser.name ||
      otherUser.username ||
      'Unknown';

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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Chat info */}
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{displayName}</Text>

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
    padding: 12,
    paddingBottom: 100,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1971c2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#666',
    marginTop: 4,
  },
});
