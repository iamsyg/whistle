// // screens/ChatScreen.tsx
// import React, { useState, useRef, useEffect } from 'react';
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
// import { router } from 'expo-router';

// export default function ChatScreen() {
//   const [activeTab, setActiveTab] = useState<'chats' | 'tasks' | 'splits'>('chats');
//   const [isAttachmentSheetVisible, setIsAttachmentSheetVisible] = useState(false);
//   const [isCallSheetVisible, setIsCallSheetVisible] = useState(false);
//   const [isMenuSheetVisible, setIsMenuSheetVisible] = useState(false);
//   const [isDarkMode, setIsDarkMode] = useState(false);
  
//   const insets = useSafeAreaInsets();
//   const flatListRef = useRef<FlatList>(null);

//   const handleTabChange = (tab: 'chats' | 'tasks' | 'splits') => {
//     setActiveTab(tab);
//   };

//   const handleSendMessage = (message: string) => {
//     console.log('Sending message:', message);
//     // Add message to chat
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

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0D1418' : '#FFFFFF' }]}>
//       {/* Header */}
//       <Header
//         title="John Doe"
//         subtitle="last seen today at 9:41 AM"
//         showBackButton={true}
//         showSearch={true}
//         showCall={true}
//         showMenu={true}
//         onBackPress={() => router.back()}
//         onCallPress={() => setIsCallSheetVisible(true)}
//         onMenuPress={() => setIsMenuSheetVisible(true)}
//         isDarkMode={isDarkMode}
//       />

//       {/* Tab Bar */}
//       <TabBar
//         activeTab={activeTab}
//         onTabChange={handleTabChange}
//         isDarkMode={isDarkMode}
//       />

//       {/* Tab Content */}
//       <View style={styles.content}>
//         {activeTab === 'chats' && <ChatsTab isDarkMode={isDarkMode} />}
//         {activeTab === 'tasks' && <TasksTab isDarkMode={isDarkMode} />}
//         {activeTab === 'splits' && <SplitsTab isDarkMode={isDarkMode} />}
//       </View>

//       {/* Chat Input (only in chats tab) */}
//       {activeTab === 'chats' && (
//         <ChatInput
//           onSend={handleSendMessage}
//           onAttachmentPress={() => setIsAttachmentSheetVisible(true)}
//           isDarkMode={isDarkMode}
//         />
//       )}

//       {/* Bottom Sheets */}
//       <AttachmentSheet
//         visible={isAttachmentSheetVisible}
//         onClose={() => setIsAttachmentSheetVisible(false)}
//         onSelect={handleAttachmentSelect}
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
//   content: {
//     flex: 1,
//   },
// });






















// screens/ChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
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
import { router } from 'expo-router';

export default function ChatScreen() {
  const [activeTab, setActiveTab] = useState<'chats' | 'tasks' | 'splits'>('chats');
  const [isAttachmentSheetVisible, setIsAttachmentSheetVisible] = useState(false);
  const [isCallSheetVisible, setIsCallSheetVisible] = useState(false);
  const [isMenuSheetVisible, setIsMenuSheetVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const handleTabChange = (tab: 'chats' | 'tasks' | 'splits') => {
    setActiveTab(tab);
  };

  const handleSendMessage = (message: string) => {
    console.log('Sending message:', message);
    // Add message to chat
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0D1418' : '#FFFFFF' }]}>
      <View style={styles.headerContainer}>
        {/* Header */}
        <Header
          title="John Doe"
          subtitle="last seen today at 9:41 AM"
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
            {activeTab === 'chats' && <ChatsTab isDarkMode={isDarkMode} />}
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



