// // frontend/app/(screens)/chatScreen.tsx

// import React, { useState, useRef, useEffect, useMemo} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   FlatList,
//   KeyboardAvoidingView,
//   Platform,
//   TouchableOpacity,
//   Modal,
//   Alert,
//   Keyboard,
//   TouchableWithoutFeedback,
//   ActivityIndicator,
// } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import Header from '@/components/MessagingHeader';
// import TabBar from '@/components/TabBar';
// import ChatsTab from '@/components/ChatsTab';
// import TasksTab from '@/components/TasksTab';
// import SplitsTab from '@/components/SplitsTab';
// import ChatInput from '@/components/ChatInput';
// import AttachmentSheet from '@/components/AttachmentSheet';
// import CallOptionsSheet from '@/components/CallOptionsSheet';
// import MenuSheet from '@/components/MenuSheet';
// import { router, useLocalSearchParams } from 'expo-router';
// import { supabase } from '@/utils/supabase';
// import { useSelector } from 'react-redux';
// import { RootState } from '@/store/store';
// import { Contact } from '@/types/contact';
// import useSendMessage from '@/hooks/useSendMessage';
// import { useDispatch } from 'react-redux';
// import { addMessage, clearConversation, setConversation } from '@/store/slices/message/conversationSlice';
// import useGetConversationId from '@/hooks/useGetConversationId';
// import useWebSocket from '@/contexts/useWebSocket';
// import { uploadMedia } from '@/utils/uploadMedia';
// import resolveMimeType from '@/utils/resolveMimeType';
// import { useFetchMembers } from '@/hooks/chat/fetchMembers/useFetchMembers';

// export default function ChatScreen() {

//   const [activeTab, setActiveTab] = useState<'chats' | 'tasks' | 'splits'>('chats');
//   const [isAttachmentSheetVisible, setIsAttachmentSheetVisible] = useState(false);
//   const [isCallSheetVisible, setIsCallSheetVisible] = useState(false);
//   const [isMenuSheetVisible, setIsMenuSheetVisible] = useState(false);
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   // const [chatId, setChatId] = useState<string | null>(null);

//   const dispatch = useDispatch();

//   // Get params and Redux state
//   // const { contactProfileId } = useLocalSearchParams<{ contactProfileId: string }>();

//   const myUserId = useSelector((state: RootState) => state.profile.userId);

//   const { selectedChatId, subConversationType, contactProfileId, chatById } = useSelector(
//     (state: RootState) => state.conversation
//   );

//   if(!selectedChatId) {
//     console.warn('⚠️  No chat selected, redirecting...');
//     Alert.alert('Error', 'No chat selected', [
//       { text: 'OK', onPress: () => router.back() }
//     ]);
//     return null;
//   }

//   console.log("ChatScreen - selectedChatId:", selectedChatId);
//   console.log("ChatScreen - subConversationType:", subConversationType);
//   console.log("ChatScreen - contactProfileId:", contactProfileId);
//   console.log("ChatScreen - myUserId:", chatById);

//   const contact = useSelector((state: RootState) =>
//     contactProfileId ? state.contacts.byProfileId[contactProfileId] : undefined
//   );

//   const conversationId = selectedChatId;

//   const { sendMessage, loading } = useSendMessage();
//   const { loading: initializingChat, error: chatError } = useGetConversationId();
//   const { isConnected, sendTypingIndicator, reconnect } = useWebSocket(); // ✅ WebSocket

//   // const groupTitle = useSelector((state: RootState) =>
//   //   (state.conversation.userAllConversations ?? []).find(
//   //     c => c.chat_id === selectedChatId
//   //   )?.title
//   // );

//   const { fetchMembers, loading: membersLoading } = useFetchMembers(selectedChatId);

//   useEffect(() => {
//     if (selectedChatId) {
//       fetchMembers();
//     }
//   }, [selectedChatId]);


//   const groupTitle = useMemo(() => {
//   return selectedChatId
//     ? chatById[selectedChatId]?.title
//     : undefined;
// }, [selectedChatId, chatById]);

//   // ✅ Determine header title with fallback chain
//   const headerTitle = useMemo(() => {
//     if (subConversationType === "direct" && contact) {
//       if (contact?.name) return contact.name;
//       if (contact?.phone) return contact.phone;
//     } else if (subConversationType === "group") {
//       return groupTitle || 'Group Chat';
//     }
//     return 'Chat';
//   }, [contact, subConversationType, groupTitle]);

//   // ✅ Get last seen status (you can enhance this with real data later)
//   const lastSeenStatus = useMemo(() => {
//     // TODO: Replace with actual last seen data from backend
//     return 'last seen today at 9:41 AM';
//   }, []);

//   const handleTabChange = (tab: 'chats' | 'tasks' | 'splits') => {
//     setActiveTab(tab);
//   };

//   const handleSendMessage = (message: string) => {
//     console.log('Sending message:', message);
//     // TODO: Implement message sending
//   };

//   const handleAttachmentSelect = (type: string) => {
//     console.log('Selected attachment type:', type);
//     setIsAttachmentSheetVisible(false);
//   };

//   const handleCallOptionSelect = (option: string) => {
//     console.log('Selected call option:', option);
//     setIsCallSheetVisible(false);
//   };

//   const handleMenuItemSelect = (item: string) => {
//     console.log('Selected menu item:', item);
//     setIsMenuSheetVisible(false);
//   };

//   useEffect(() => {
//     if (subConversationType === "direct" && !contactProfileId) {
//       console.warn('⚠️  No contact selected, redirecting...');
//       Alert.alert('Error', 'No contact selected', [
//         { text: 'OK', onPress: () => router.back() }
//       ]);
//     }
//   }, [contactProfileId, subConversationType]);

//   useEffect(() => {
//     return () => {
//       console.log('🧹 Clearing conversation on unmount');
//       dispatch(clearConversation());
//     };
//   }, [dispatch]);

//   // useGetConversationId();

//   // ✅ Debug logging
//   useEffect(() => {
//     console.log('📱 ChatScreen State:');
//     console.log('  - Contact Profile ID:', contactProfileId);
//     console.log('  - Contact Name:', contact?.name);
//     console.log('  - Conversation ID:', conversationId);
//     console.log('  - WebSocket Connected:', isConnected);
//   }, [contactProfileId, contact, conversationId, isConnected]);


//   const handleMediaSelected = async (media: any[]) => {
//     console.log('Selected media:', media);

//     // Process the selected media here
//     // 1. Upload to server
//     // 2. Display in chat
//     // 3. Store link in database

//     if (!conversationId || !subConversationType) return;

//     try {
      
//         await Promise.all(
//           media.map(async (item) => {

//             const mimeType = resolveMimeType(item);
            
//             const uploadedMessage = await uploadMedia({
//               uri: item.uri,
//               fileName: item.fileName ?? item.name ?? 'file',
//               mimeType: mimeType,
//               chatId: conversationId,
//               conversationType: subConversationType,
//             });

//             console.log('Uploaded media message:', uploadedMessage);

//             // Add message instantly to Redux store
//             dispatch(addMessage({
//               chat_id: conversationId,
//               message: uploadedMessage,
//             }))
//           }));
      
//     } catch (error) {
//       console.error(error);
//       Alert.alert('Upload failed', 'Could not upload media');
//     };

//     media.forEach(item => {
//       if (item.type === 'image') {
//         // Handle image
//         console.log('Image selected:', item.uri);
//       } else if (item.type === 'video') {
//         // Handle video
//         console.log('Video selected:', item.uri);
//       } else {
//         console.log('document selected:', item.uri);
//       }
//     });
//   };

//   return (
//     <SafeAreaView
//       style={[
//         styles.container,
//         { backgroundColor: isDarkMode ? '#0D1418' : '#FFFFFF' }
//       ]}
//     >
//       <View style={styles.headerContainer}>
//         <Header
//           title={headerTitle}
//           subtitle={lastSeenStatus}
//           showBackButton={true}
//           showSearch={true}
//           showCall={true}
//           showMenu={true}
//           onBackPress={() => router.back()}
//           onCallPress={() => setIsCallSheetVisible(true)}
//           onMenuPress={() => setIsMenuSheetVisible(true)}
//           isDarkMode={isDarkMode}
//         />

//         <TabBar
//           tabs={[
//             { id: 'chats', label: 'Chats' },
//             { id: 'tasks', label: 'Tasks' },
//             { id: 'splits', label: 'Splits' },
//           ]}
//           activeTab={activeTab}
//           onTabChange={handleTabChange}
//           isDarkMode={isDarkMode}
//         />
//       </View>

//       <KeyboardAvoidingView
//         style={styles.keyboardView}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
//       >
//         <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//           <View style={styles.content}>
//             {/* ✅ Show loading overlay while initializing */}
//             {initializingChat ? (
//               <View style={styles.initializingContainer}>
//                 <ActivityIndicator size="large" color="#1971c2" />
//               </View>
//             ) : (
//               <>
//                 {activeTab === 'chats' && <ChatsTab isDarkMode={isDarkMode} />}
//                 {activeTab === 'tasks' && <TasksTab isDarkMode={isDarkMode} />}
//                 {activeTab === 'splits' && <SplitsTab isDarkMode={isDarkMode} />}
//               </>
//             )}
//           </View>
//         </TouchableWithoutFeedback>

//         {/* Chat Input (only in chats tab and after chat is initialized) */}
//         {activeTab === 'chats' && conversationId && !initializingChat && (
//           <ChatInput
//             onSend={sendMessage}
//             onAttachmentPress={() => setIsAttachmentSheetVisible(true)}
//             isDarkMode={isDarkMode}
//             onTyping={sendTypingIndicator}
//           />
//         )}
//       </KeyboardAvoidingView>

//       {/* Bottom Sheets */}
//       <AttachmentSheet
//         visible={isAttachmentSheetVisible}
//         onClose={() => setIsAttachmentSheetVisible(false)}
//         onSelect={handleAttachmentSelect}
//         onMediaSelected={handleMediaSelected}
//         isDarkMode={isDarkMode}
//       />

//       <CallOptionsSheet
//         visible={isCallSheetVisible}
//         onClose={() => setIsCallSheetVisible(false)}
//         onSelect={handleCallOptionSelect}
//         isDarkMode={isDarkMode}
//       />

//       <MenuSheet
//         visible={isMenuSheetVisible}
//         onClose={() => setIsMenuSheetVisible(false)}
//         onSelect={handleMenuItemSelect}
//         isDarkMode={isDarkMode}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   headerContainer: {},
//   keyboardView: {
//     flex: 1,
//   },
//   content: {
//     flex: 1,
//   },
//   initializingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });














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
  { id: 'chats',  label: 'Chats'  },
  { id: 'tasks',  label: 'Tasks'  },
  { id: 'splits', label: 'Splits' },
];

export default function ChatScreen() {
  const [activeTab, setActiveTab] = useState<ChatTab>('chats');
  const [isDarkMode]              = useState(false);

  // ── Track ANY modal/sheet being open so we can disable background swipe ───
  const [isAttachmentSheetVisible, setIsAttachmentSheetVisible] = useState(false);
  const [isCallSheetVisible,       setIsCallSheetVisible]       = useState(false);
  const [isMenuSheetVisible,       setIsMenuSheetVisible]       = useState(false);

  // SplitsTab needs to tell us when its CreateSplitModal is open.
  // We lift that state up here so panHandlers can be disabled.
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  // True when ANY overlay is visible – disables background swipe
  const isAnyModalOpen =
    isAttachmentSheetVisible ||
    isCallSheetVisible       ||
    isMenuSheetVisible       ||
    isSplitModalOpen;

  const dispatch = useDispatch();

  const { selectedChatId, subConversationType, contactProfileId, chatById } = useSelector(
    (s: RootState) => s.conversation
  );

  if (!selectedChatId) {
    Alert.alert('Error', 'No chat selected', [{ text: 'OK', onPress: () => router.back() }]);
    return null;
  }

  const contact = useSelector((s: RootState) =>
    contactProfileId ? s.contacts.byProfileId[contactProfileId] : undefined
  );

  const conversationId = selectedChatId;

  const { sendMessage }               = useSendMessage();
  const { loading: initializingChat } = useGetConversationId();
  const { sendTypingIndicator }       = useWebSocket();
  const { fetchMembers }              = useFetchMembers(selectedChatId);

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
  useEffect(() => { if (selectedChatId) fetchMembers(); }, [selectedChatId]);

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

  const handleMediaSelected = useCallback(async (media: any[]) => {
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
        dispatch(addMessage({ chat_id: conversationId, message: uploaded }));
      }));
    } catch {
      Alert.alert('Upload failed', 'Could not upload media');
    }
  }, [conversationId, subConversationType, dispatch]);

  return (
    <SafeAreaView style={[st.container, { backgroundColor: isDarkMode ? '#0D1418' : '#FFFFFF' }]}>

      {/* ── Header + TabBar ─────────────────────────────────────────────── */}
      <View>
        <Header
          title={headerTitle}
          subtitle="last seen today at 9:41 AM"
          showBackButton showSearch showCall showMenu
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
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
});