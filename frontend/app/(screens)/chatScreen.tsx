// screens/ChatScreen.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/MessagingHeader';
import TabBar from '@/components/TabBar';
import ChatsTab from '@/components/ChatsTab';
import TasksTab from '@/components/TasksTab';
import SplitsTab from '@/components/SplitsTab';
import ChatInput from '@/components/ChatInput';
import AttachmentSheet from '@/components/AttachmentSheet';
import CallOptionsSheet from '@/components/CallOptionsSheet';
import MenuSheet from '@/components/MenuSheet';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Contact } from '@/types/contact';
import useSendMessage from '@/hooks/useSendMessage';
import { useDispatch } from 'react-redux';
import { clearConversation, setConversation } from '@/store/slices/message/conversationSlice';
import useGetConversationId from '@/hooks/useGetConversationId';
import useWebSocket from '@/contexts/useWebSocket';

export default function ChatScreen() {

  const [activeTab, setActiveTab] = useState<'chats' | 'tasks' | 'splits'>('chats');
  const [isAttachmentSheetVisible, setIsAttachmentSheetVisible] = useState(false);
  const [isCallSheetVisible, setIsCallSheetVisible] = useState(false);
  const [isMenuSheetVisible, setIsMenuSheetVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // const [chatId, setChatId] = useState<string | null>(null);

  const dispatch = useDispatch();

  // Get params and Redux state
  // const { contactProfileId } = useLocalSearchParams<{ contactProfileId: string }>();

  const myUserId = useSelector((state: RootState) => state.profile.userId);

  const {selectedConversationId, conversationType, contactProfileId} = useSelector(
    (state: RootState) => state.conversation
  );

  const contact = useSelector((state: RootState) =>
    contactProfileId ? state.contacts.byProfileId[contactProfileId] : undefined
  );

  const conversationId = selectedConversationId;

  const { sendMessage, loading } = useSendMessage();
  const { loading: initializingChat, error: chatError } = useGetConversationId();
  const { isConnected, sendTypingIndicator, reconnect } = useWebSocket(); // ✅ WebSocket

  const groupTitle = useSelector((state: RootState) =>
  state.conversation.userAllConversations.find(
    c => c.chat_id === selectedConversationId
  )?.title
);

  // ✅ Determine header title with fallback chain
  const headerTitle = useMemo(() => {
    if(conversationType === "direct" && contact) {
      if (contact?.name) return contact.name;
      if (contact?.phone) return contact.phone;
    } else if (conversationType === "group") {
      return groupTitle || 'Group Chat';
    }
    return 'Chat';
  }, [contact, conversationType]);

  // ✅ Get last seen status (you can enhance this with real data later)
  const lastSeenStatus = useMemo(() => {
    // TODO: Replace with actual last seen data from backend
    return 'last seen today at 9:41 AM';
  }, []);

  const handleTabChange = (tab: 'chats' | 'tasks' | 'splits') => {
    setActiveTab(tab);
  };

  const handleSendMessage = (message: string) => {
    console.log('Sending message:', message);
    // TODO: Implement message sending
  };

  const handleAttachmentSelect = (type: string) => {
    console.log('Selected attachment type:', type);
    setIsAttachmentSheetVisible(false);
  };

  const handleCallOptionSelect = (option: string) => {
    console.log('Selected call option:', option);
    setIsCallSheetVisible(false);
  };

  const handleMenuItemSelect = (item: string) => {
    console.log('Selected menu item:', item);
    setIsMenuSheetVisible(false);
  };

  useEffect(() => {
    if (conversationType === "direct" && !contactProfileId) {
      console.warn('⚠️  No contact selected, redirecting...');
      Alert.alert('Error', 'No contact selected', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [contactProfileId, conversationType]);

  useEffect(() => {
    return () => {
      console.log('🧹 Clearing conversation on unmount');
      dispatch(clearConversation());
    };
  }, [dispatch]);

  // useGetConversationId();

  // ✅ Debug logging
  useEffect(() => {
    console.log('📱 ChatScreen State:');
    console.log('  - Contact Profile ID:', contactProfileId);
    console.log('  - Contact Name:', contact?.name);
    console.log('  - Conversation ID:', conversationId);
    console.log('  - WebSocket Connected:', isConnected);
  }, [contactProfileId, contact, conversationId, isConnected]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#0D1418' : '#FFFFFF' }
      ]}
    >
      <View style={styles.headerContainer}>
        <Header
          title={headerTitle}
          subtitle={lastSeenStatus}
          showBackButton={true}
          showSearch={true}
          showCall={true}
          showMenu={true}
          onBackPress={() => router.back()}
          onCallPress={() => setIsCallSheetVisible(true)}
          onMenuPress={() => setIsMenuSheetVisible(true)}
          isDarkMode={isDarkMode}
        />

        <TabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isDarkMode={isDarkMode}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* ✅ Show loading overlay while initializing */}
            {initializingChat ? (
              <View style={styles.initializingContainer}>
                <ActivityIndicator size="large" color="#1971c2" />
              </View>
            ) : (
              <>
                {activeTab === 'chats' && <ChatsTab isDarkMode={isDarkMode} />}
                {activeTab === 'tasks' && <TasksTab isDarkMode={isDarkMode} />}
                {activeTab === 'splits' && <SplitsTab isDarkMode={isDarkMode} />}
              </>
            )}
          </View>
        </TouchableWithoutFeedback>

        {/* Chat Input (only in chats tab and after chat is initialized) */}
        {activeTab === 'chats' && conversationId && !initializingChat && (
          <ChatInput
            onSend={sendMessage}
            onAttachmentPress={() => setIsAttachmentSheetVisible(true)}
            isDarkMode={isDarkMode}
            onTyping={sendTypingIndicator}
          />
        )}
      </KeyboardAvoidingView>

      {/* Bottom Sheets */}
      <AttachmentSheet
        visible={isAttachmentSheetVisible}
        onClose={() => setIsAttachmentSheetVisible(false)}
        onSelect={handleAttachmentSelect}
        isDarkMode={isDarkMode}
      />

      <CallOptionsSheet
        visible={isCallSheetVisible}
        onClose={() => setIsCallSheetVisible(false)}
        onSelect={handleCallOptionSelect}
        isDarkMode={isDarkMode}
      />

      <MenuSheet
        visible={isMenuSheetVisible}
        onClose={() => setIsMenuSheetVisible(false)}
        onSelect={handleMenuItemSelect}
        isDarkMode={isDarkMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {},
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  initializingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});