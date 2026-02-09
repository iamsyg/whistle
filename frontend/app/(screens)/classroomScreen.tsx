// frontend/app/(screens)/classroomScreen.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { router, useLocalSearchParams } from 'expo-router';
import Header from '@/components/MessagingHeader';
import ClassroomTabBar from '@/components/ClassroomTabBar';
import ClassroomChatsTab from '@/components/ClassroomChatsTab';
import AnnouncementsTab from '@/components/AnnouncementsTab';
import AssignmentsTab from '@/components/AssignmentsTab';
import ChatInput from '@/components/ChatInput';
import AttachmentSheet from '@/components/AttachmentSheet';
import CallOptionsSheet from '@/components/CallOptionsSheet';
import MenuSheet from '@/components/MenuSheet';
import { RootState } from '@/store/store';
import { setSelectedClassroom } from '@/store/slices/classroom/classroomSlice';
import useSendClassroomMessage from '@/hooks/classroom/messages/useSendClassroomMessage';
import useWebSocket from '@/contexts/useWebSocket';
import { useFetchJoinRequests } from '@/hooks/useFetchJoinRequests';
import AdminJoinRequestToast from '@/components/AdminJoinRequestToast';
import { useAcceptClassroomRequest } from '@/hooks/classroom/useAcceptClassroomRequest';
import { useRejectClassroomRequest } from '@/hooks/classroom/useRejectClassroomRequest';

type ClassroomTab = 'chats' | 'announcements' | 'assignments';

const ClassroomScreen = () => {
  const [activeTab, setActiveTab] = useState<ClassroomTab>('chats');
  const [isAttachmentSheetVisible, setIsAttachmentSheetVisible] = useState(false);
  const [isCallSheetVisible, setIsCallSheetVisible] = useState(false);
  const [isMenuSheetVisible, setIsMenuSheetVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [joinRequestCount, setJoinRequestCount] = useState(0);
  const [displayIdentity, setDisplayIdentity] = useState<string | null>(null);
  const [classroomRequestId, setClassroomRequestId] = useState<string | null>(null);
  const [showJoinToast, setShowJoinToast] = useState(true);

  const dispatch = useDispatch();
  const { chat_id } = useLocalSearchParams<{ chat_id: string }>();

  const selectedClassroomId = useSelector(
    (state: RootState) => state.classroom.selectedClassroomId
  );

  const classroom = useSelector((state: RootState) =>
    chat_id ? state.classroom.classrooms[chat_id] : undefined
  );

  const { sendMessage, loading: sendingMessage } = useSendClassroomMessage(chat_id);
  const { isConnected, sendTypingIndicator, reconnect } = useWebSocket('classroom');
  const { fetchRequests, loading: loadingRequests, error: requestsError } = useFetchJoinRequests(chat_id || '');

  // Set selected classroom in Redux
  useEffect(() => {
    if (chat_id && chat_id !== selectedClassroomId) {
      dispatch(setSelectedClassroom(chat_id));
    }
  }, [chat_id, selectedClassroomId, dispatch]);

  // Handle tab change
  const handleTabChange = (tab: ClassroomTab) => {
    setActiveTab(tab);
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

  // Determine header title
  const headerTitle = useMemo(() => {
    return classroom?.title || 'Classroom';
  }, [classroom]);

  // Determine subtitle (you can add more logic here for class code, etc.)
  const headerSubtitle = useMemo(() => {
    return classroom?.description || '';
  }, [classroom]);

  // Show loading if classroom not found
  if (!classroom) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.initializingContainer}>
          <ActivityIndicator size="large" color="#1971c2" />
          <Text style={styles.loadingText}>Loading classroom...</Text>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    if (!classroom?.is_admin) return;

    fetchRequests().then((res) => {
      if (res?.count) {
        setJoinRequestCount(res.count);
        setDisplayIdentity(res.requests[0]?.display_identity || "User");
        setClassroomRequestId(res.requests[0]?.id || null);
        setShowJoinToast(true);
      }
    });
  }, [classroom?.is_admin]);

  const { acceptClassroomRequest, loading: acceptingRequest, error: acceptRequestError } = useAcceptClassroomRequest(classroomRequestId || '');

  const { rejectClassroomRequest, loading: rejectingRequest, error: rejectRequestError } = useRejectClassroomRequest(classroomRequestId || '');

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
          subtitle={headerSubtitle}
          showBackButton={true}
          showSearch={true}
          showCall={true}
          showMenu={true}
          onBackPress={() => router.back()}
          onCallPress={() => setIsCallSheetVisible(true)}
          onMenuPress={() => setIsMenuSheetVisible(true)}
          isDarkMode={isDarkMode}
          onPress={() => {
            router.push({
              pathname: '/(screens)/classroomProfile',
              params: { chat_id }
            })
          }}
        />

        <ClassroomTabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isDarkMode={isDarkMode}
        />

        {classroom?.is_admin && showJoinToast && joinRequestCount > 0 && (
          <AdminJoinRequestToast
            count={joinRequestCount}
            isDarkMode={isDarkMode}
            displayIdentity={displayIdentity}
            onAccept={() => {
              // router.push(`/(screens)/joinRequests?chat_id=${chat_id}`);
              acceptClassroomRequest();
              setShowJoinToast(false);
            }}
            onReject={() => {
              // router.push(`/(screens)/joinRequests?chat_id=${chat_id}`);
              rejectClassroomRequest();
              setShowJoinToast(false);
            }}
            onDismiss={() => setShowJoinToast(false)}
          />
        )}

      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Show appropriate tab content */}
            {activeTab === 'chats' && <ClassroomChatsTab isDarkMode={isDarkMode} />}
            {activeTab === 'announcements' && <AnnouncementsTab />}
            {activeTab === 'assignments' && <AssignmentsTab />}
          </View>
        </TouchableWithoutFeedback>

        {/* Chat Input (only in chats tab) */}
        {activeTab === 'chats' && chat_id && (
          <ChatInput
            onSend={sendMessage}
            onAttachmentPress={() => setIsAttachmentSheetVisible(true)}
            isDarkMode={isDarkMode}
            onTyping={sendTypingIndicator}
          // disabled={sendingMessage}
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
};

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
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default ClassroomScreen;