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

export default function ChatScreen() {
  const [activeTab, setActiveTab] = useState<'chats' | 'tasks' | 'splits'>('chats');
  const [isAttachmentSheetVisible, setIsAttachmentSheetVisible] = useState(false);
  const [isCallSheetVisible, setIsCallSheetVisible] = useState(false);
  const [isMenuSheetVisible, setIsMenuSheetVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // const [chatId, setChatId] = useState<string | null>(null);
  
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Get params and Redux state
  const { contactId } = useLocalSearchParams<{ contactId: string }>();
  // const myUserId = useSelector((state: RootState) => state.profile.userId);
  const contacts = useSelector((state: RootState) => state.contacts.all);

  // ✅ Find contact from Redux store using profileId
  const contact = useMemo(
    () => contacts.find((c: Contact) => c.profileId === contactId),
    [contacts, contactId]
  );

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

  // ✅ Initialize chat when component mounts
  // useEffect(() => {
  //   if (!contactId || !myUserId || chatId) return;

  //   const initChat = async () => {
  //     try {
  //       const token = await getAccessToken();
  //       if (!token) {
  //         console.error('No auth token available');
  //         return;
  //       }

  //       console.log('Initializing chat with contactId:', contactId);

  //       const res = await fetch(
  //         `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/direct/init/${contactId}`,
  //         {
  //           method: 'POST',
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             'Content-Type': 'application/json',
  //           },
  //         }
  //       );

  //       if (!res.ok) {
  //         console.error('Chat init failed:', res.status);
  //         const errorText = await res.text();
  //         console.error('Error details:', errorText);
  //         return;
  //       }

  //       const chat = await res.json();
  //       console.log('Chat initialized:', chat.id);
  //       setChatId(chat.id);
  //     } catch (err) {
  //       console.error('Init chat error:', err);
  //     }
  //   };

  //   initChat();
  // }, [contactId, myUserId, chatId]);

  // ✅ Debug logging
  useEffect(() => {
    console.log('ChatScreen - Selected contact profile ID:', contactId);
    console.log('ChatScreen - Found Contact:', contact);
    console.log('ChatScreen - Header Title:', headerTitle);
  }, [contactId, contact, headerTitle]);

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
            onSend={handleSendMessage}
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