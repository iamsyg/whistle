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
  Keyboard,
  TouchableWithoutFeedback,
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
import useSendMessage from '@/contexts/sendMessage';
import { useDispatch } from 'react-redux';
import { setConversation } from '@/store/slices/message/conversationSlice';

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

  const contactProfileId = useSelector(
    (state: RootState) => state.conversation.contactProfileId
  );

  const myUserId = useSelector((state: RootState) => state.profile.userId);

  const contact = useSelector((state: RootState) =>
    contactProfileId ? state.contacts.byProfileId[contactProfileId] : undefined
  );


  // ✅ Find contact from Redux store using profileId
  // const contact = useMemo(
  //   () => contacts.find((c: Contact) => c.profileId === contactProfileId),
  //   [contacts, contactProfileId]
  // );

  const { sendMessage, loading } = useSendMessage();

  // ✅ Determine header title with fallback chain
  const headerTitle = useMemo(() => {
    if (contact?.name) return contact.name;
    if (contact?.phone) return contact.phone;
    return 'Chat';
  }, [contact]);

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

  const getAccessToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    return data.session.access_token;
  };

  useEffect(() => {
    if (!contactProfileId || !myUserId) return;

    const initChat = async () => {
      const token = await getAccessToken();
      if (!token) return;

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/direct/init/${contactProfileId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      // setChatId(data.chat_id);
      // dispatch(setSelectedConversationId(data.chat_id));

      dispatch(setConversation({
        contactProfileId: contactProfileId,
        conversationId: data.chat_id
      }))

      console.log('Chat initialized:', data.chat_id);
    };

    initChat();
  }, [contactProfileId, myUserId]);



  // ✅ Debug logging
  useEffect(() => {
    console.log('ChatScreen - Selected contact profile ID:', contactProfileId);
    console.log('ChatScreen - Found Contact:', contact);
    console.log('ChatScreen - Header Title:', headerTitle);
  }, [contactProfileId, contact, headerTitle]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0D1418' : '#FFFFFF' }]}>
      <View style={styles.headerContainer}>
        {/* Header */}
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

        {/* Tab Bar */}
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
            {activeTab === 'chats' && (
              <ChatsTab
                isDarkMode={isDarkMode}
              />
            )}
            {activeTab === 'tasks' && <TasksTab isDarkMode={isDarkMode} />}
            {activeTab === 'splits' && <SplitsTab isDarkMode={isDarkMode} />}
          </View>
        </TouchableWithoutFeedback>

        {/* Chat Input (only in chats tab) */}
        {activeTab === 'chats' && (
          <ChatInput
            onSend={sendMessage}
            onAttachmentPress={() => setIsAttachmentSheetVisible(true)}
            isDarkMode={isDarkMode}
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
  headerContainer: {
    // Header and TabBar stay fixed at top
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});