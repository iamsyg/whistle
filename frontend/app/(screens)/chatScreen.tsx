// frontend/app/(screens)/chatScreen.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Header from '@/components/MessagingHeader';
import TabBar, { useTabSwipe, SwipeableTabContent } from '@/components/TabBar';
import ChatsTab from '@/components/ChatsTab';
import TasksTab from '@/components/TasksTab';
import SplitsTab from '@/components/SplitsTab';
import ChatInput from '@/components/ChatInput';
import AttachmentSheet from '@/components/AttachmentSheet';
import CallOptionsSheet from '@/components/CallOptionsSheet';
import MenuSheet from '@/components/MenuSheet';
import { router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import useSendMessage from '@/hooks/useSendMessage';
import { addMessage, clearConversation } from '@/store/slices/message/conversationSlice';
import useGetConversationId from '@/hooks/useGetConversationId';
import useWebSocket from '@/contexts/useWebSocket';
import { uploadMedia } from '@/utils/uploadMedia';
import resolveMimeType from '@/utils/resolveMimeType';
import { useFetchMembers } from '@/hooks/chat/fetchMembers/useFetchMembers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ChatTab = 'chats' | 'tasks' | 'splits';

const TABS: { id: ChatTab; label: string }[] = [
  { id: 'chats', label: 'Chats' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'splits', label: 'Splits' },
];

export default function ChatScreen() {

  const [activeTab, setActiveTab] = useState<ChatTab>('chats');
  const [isDarkMode] = useState(false);
  const [isAttachmentSheetVisible, setIsAttachmentSheetVisible] = useState(false);
  const [isCallSheetVisible, setIsCallSheetVisible] = useState(false);
  const [isMenuSheetVisible, setIsMenuSheetVisible] = useState(false);

  // SplitsTab needs to tell us when its CreateSplitModal is open.
  // We lift that state up here so panHandlers can be disabled.
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  // True when ANY overlay is visible – disables background swipe
  const isAnyModalOpen =
    isAttachmentSheetVisible ||
    isCallSheetVisible ||
    isMenuSheetVisible ||
    isSplitModalOpen;

  const dispatch = useDispatch();

  const { selectedChatId, subConversationType, contactProfileId, chatById } = useSelector(
    (state: RootState) => state.conversation
  );

  if (!selectedChatId) {
    Alert.alert('Error', 'No chat selected', [{ text: 'OK', onPress: () => router.back() }]);
    return null;
  }

  const contact = useSelector((state: RootState) =>
    contactProfileId ? state.contacts.byProfileId[contactProfileId] : undefined
  );

  const conversationId = selectedChatId;

  const { sendMessage } = useSendMessage();
  const { loading: initializingChat } = useGetConversationId();
  const { isConnected, sendTypingIndicator, reconnect } = useWebSocket();
  const { fetchMembers } = useFetchMembers(selectedChatId);

  // ── Animated swipe ────────────────────────────────────────────────────────
  const { panHandlers, translateX } = useTabSwipe(
    TABS,
    activeTab,
    setActiveTab,
    SCREEN_WIDTH,
  );

  // When a modal is open we pass empty panHandlers (plain object, no gestures)
  // so touches pass straight through to the modal/sheet above.
  const activePanHandlers = isAnyModalOpen ? {} : panHandlers;

  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => { 
    if (selectedChatId) fetchMembers(); 
  }, [selectedChatId]);

  useEffect(() => {
    if (subConversationType === 'direct' && !contactProfileId) {
      Alert.alert('Error', 'No contact selected', [{ text: 'OK', onPress: () => router.back() }]);
    }
  }, [contactProfileId, subConversationType]);

  useEffect(() => () => { dispatch(clearConversation()); }, [dispatch]);

  const groupTitle = useMemo(
    () => selectedChatId ? chatById[selectedChatId]?.title : undefined,
    [selectedChatId, chatById]
  );

  const headerTitle = useMemo(() => {
    if (subConversationType === 'direct' && contact) return contact.name || contact.phone || 'Chat';

    if (subConversationType === 'group') return groupTitle || 'Group Chat';
    
    return 'Chat';
  }, [contact, subConversationType, groupTitle]);

  const lastSeenStatus = useMemo(() => {
    // TODO: Replace with actual last seen data from backend
    return 'last seen today at 9:41 AM';
  }, []);

  const handleMediaSelected = useCallback(async (media: any[]) => {
    console.log('Selected media:', media);

    // Process the selected media here
    // 1. Upload to server
    // 2. Display in chat
    // 3. Store link in database

    if (!conversationId || !subConversationType) return;
    try {

      await Promise.all(media.map(async item => {
        const mimeType = resolveMimeType(item);

        const uploaded = await uploadMedia({
          uri: item.uri,
          fileName: item.fileName ?? item.name ?? 'file',
          mimeType,
          chatId: conversationId,
          conversationType: subConversationType,
        });

        console.log('Uploaded media message:', uploaded);
        
        dispatch(addMessage({ 
          chat_id: conversationId, 
          message: uploaded 
        }));
      }));

    } catch (error) {

      console.error('Error uploading media:', error);
      Alert.alert('Upload failed', 'Could not upload media');
    }
  }, [conversationId, subConversationType, dispatch]);

  return (
    <SafeAreaView style={[st.container, { backgroundColor: isDarkMode ? '#0D1418' : '#FFFFFF' }]}>

      {/* ── Header + TabBar ─────────────────────────────────────────────── */}
      <View>
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
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isDarkMode={isDarkMode}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {initializingChat ? (
          <View style={st.loader}>
            <ActivityIndicator size="large" color="#1971c2" />
          </View>
        ) : (
          <>
            {/*
              activePanHandlers is empty ({}) when any modal is open,
              so swipe gestures are ignored and don't bleed through to
              the background content.
            */}
            <View style={{ flex: 1 }} {...activePanHandlers}>
              <SwipeableTabContent translateX={translateX} screenWidth={SCREEN_WIDTH}>
                <ChatsTab isDarkMode={isDarkMode} />
                <TasksTab isDarkMode={isDarkMode} />
                {/*
                  Pass onModalOpenChange so SplitsTab can tell us
                  when CreateSplitModal opens/closes.
                */}
                <SplitsTab
                  isDarkMode={isDarkMode}
                  onModalOpenChange={setIsSplitModalOpen}
                />
              </SwipeableTabContent>
            </View>

            {activeTab === 'chats' && conversationId && (
              <ChatInput
                onSend={sendMessage}
                onAttachmentPress={() => setIsAttachmentSheetVisible(true)}
                isDarkMode={isDarkMode}
                onTyping={sendTypingIndicator}
              />
            )}
          </>
        )}
      </KeyboardAvoidingView>

      {/* ── Bottom sheets ───────────────────────────────────────────────── */}
      <AttachmentSheet
        visible={isAttachmentSheetVisible}
        onClose={() => setIsAttachmentSheetVisible(false)}
        onSelect={() => setIsAttachmentSheetVisible(false)}
        onMediaSelected={handleMediaSelected}
        isDarkMode={isDarkMode}
      />
      <CallOptionsSheet
        visible={isCallSheetVisible}
        onClose={() => setIsCallSheetVisible(false)}
        onSelect={() => setIsCallSheetVisible(false)}
        isDarkMode={isDarkMode}
      />
      <MenuSheet
        visible={isMenuSheetVisible}
        onClose={() => setIsMenuSheetVisible(false)}
        onSelect={() => setIsMenuSheetVisible(false)}
        isDarkMode={isDarkMode}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});