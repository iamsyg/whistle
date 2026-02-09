// frontend/components/ClassroomChatsTab.tsx

import React, { useRef, useState, useEffect, useMemo, use } from 'react';
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
import MessageLayoutClassroom from './MessageLayoutClassroom'; 
import useGetClassroomMessages from '@/hooks/classroom/messages/useGetClassroomMessage';
import { mapClassroomBackendMessageToUI } from '@/utils/messageMapper';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ClassroomFrontendMessage } from '@/types/frontend/classroomMessage';
// import { ClassroomBackendMessage } from '@/types/backend/classroomMessage';

interface ChatsTabProps {
  isDarkMode?: boolean;
  chatId?: string | null;
}

const ClassroomChatsTab: React.FC<ChatsTabProps> = ({ isDarkMode = false }) => {

  const flatListRef = useRef<FlatList<ClassroomFrontendMessage>>(null);

  // const chatId = useSelector((state: RootState) => state.conversation.selectedConversationId)
  const chatId = useSelector(
    (state: RootState) => state.classroom.selectedClassroomId
  );

  const { loading } = useGetClassroomMessages(chatId);
  const myProfileId = useSelector((state: RootState) => state.profile.userId);

  const backendMessages = useSelector(
    (state: RootState) =>
      chatId
        ? state.classroom.classroomMessages[chatId] ?? []
        : []
  );

  const contactsByProfileId = useSelector(
    (state: RootState) => state.contacts.byProfileId
  );

  const requireEmail = useSelector((state: RootState) =>
    chatId
      ? !!state.classroom.classrooms[chatId]?.require_email
      : false
  );

  const uiMessages = useMemo(() => {
    if (!myProfileId || !chatId) return [];

    return backendMessages.map(m =>
        mapClassroomBackendMessageToUI(
          m,
          myProfileId,
          requireEmail
        )
      );
  }, [backendMessages, myProfileId, chatId, contactsByProfileId, requireEmail]);

  useEffect(() => {
    console.log('🧑 My Profile ID:', myProfileId);
    backendMessages.forEach((m) => {
      console.log('📨 Message sender:', m.sender_id);
    });
  }, [backendMessages, myProfileId]);


  useEffect(() => {
    if (uiMessages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [uiMessages.length]);



  const renderMessage = ({ item }: { item: ClassroomFrontendMessage }) => (
    <MessageLayoutClassroom
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
      {loading && uiMessages.length === 0 ? (
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

export default ClassroomChatsTab;