// frontend/components/ChatsTab.tsx

import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
// import MessageBubble from './MessageBubble';
import MessageLayout from './MessageLayout';
import useGetMessage from '@/hooks/useGetMessage';
import { mapBackendMessageToUI } from '@/utils/messageMapper';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { FrontendMessage } from '@/types/frontend/message';

interface ChatsTabProps {
  isDarkMode?: boolean;
  chatId?: string | null;
}

const ChatsTab: React.FC<ChatsTabProps> = ({ isDarkMode = false }) => {

  const flatListRef = useRef<FlatList<FrontendMessage>>(null);

  const chatId = useSelector((state: RootState) => state.conversation.selectedChatId)

  const { loading } = useGetMessage(chatId);
  const myProfileId = useSelector((state: RootState) => state.profile.userId);

  const selectedChatId = useSelector(
    (state: RootState) => state.conversation.selectedChatId
  );

  const backendMessages = useSelector(
    (state: RootState) =>
      selectedChatId
        ? state.conversation.chatMessages[selectedChatId] ?? []
        : []
  );

  console.log("ChatsTab - selectedChatId:", selectedChatId);
  console.log("ChatsTab - myProfileId:", myProfileId);

  const contactsByProfileId = useSelector(
    (state: RootState) => state.contacts.byProfileId
  );

  const uiMessages = useMemo(() => {
    if (!myProfileId) return [];
    return backendMessages.map((m) =>
      mapBackendMessageToUI(
        m,
        myProfileId,
        contactsByProfileId
      )
    );
  }, [backendMessages, myProfileId, contactsByProfileId]);

  useEffect(() => {
    console.log('🧑 My Profile ID:', myProfileId);
  }, [backendMessages, myProfileId]);

  const renderMessage = ({ item }: { item: FrontendMessage }) => (
    <MessageLayout
      message={item}
      isOwnMessage={item.senderId === myProfileId}
      isDarkMode={isDarkMode}
    />
  );

  const theme = {
    light: {
      background: '#FFFFFF',
    },
    dark: {
      background: '#0D1418',
    },
  };

  const colors = isDarkMode ? theme.dark : theme.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#00A884' : '#008069'} />
        </View>
      ) : (

        <FlatList
          ref={flatListRef}
          data={uiMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 80,
  },
});

export default ChatsTab;