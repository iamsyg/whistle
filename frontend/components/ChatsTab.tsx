// components/ChatsTab.tsx
import React, { useRef, useState, useEffect } from 'react';
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

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'image' | 'document' //| 'task' | 'split';
  metadata?: any;
}

interface ChatsTabProps {
  isDarkMode?: boolean;
}

const ChatsTab: React.FC<ChatsTabProps> = ({ isDarkMode = false }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Mock data
  const mockMessages: Message[] = [
    {
      id: '1',
      text: 'Hey there! How are you doing?',
      senderId: 'other',
      timestamp: new Date(Date.now() - 3600000),
      isRead: true,
      type: 'text',
    },
    {
      id: '2',
      text: "I'm doing great! Just finished the project we were working on.",
      senderId: 'me',
      timestamp: new Date(Date.now() - 3000000),
      isRead: true,
      type: 'text',
    },
    {
      id: '3',
      text: "That's awesome! Can you share the final design with me?",
      senderId: 'other',
      timestamp: new Date(Date.now() - 2400000),
      isRead: true,
      type: 'text',
    },
    {
      id: '4',
      text: 'Sure! I just uploaded it to the shared drive.',
      senderId: 'me',
      timestamp: new Date(Date.now() - 1800000),
      isRead: true,
      type: 'text',
    },
    {
      id: '5',
      text: "Great! Also, don't forget about the team meeting tomorrow at 10 AM.",
      senderId: 'other',
      timestamp: new Date(Date.now() - 1200000),
      isRead: true,
      type: 'text',
    },
    {
      id: '6',
      text: "Great! Also, don't forget about the team meeting tomorrow at 10 AM.",
      senderId: 'other',
      timestamp: new Date(Date.now() - 1200000),
      isRead: true,
      type: 'text',
    },
    {
      id: '7',
      text: "Great! Also, don't forget about the team meeting tomorrow at 10 AM.",
      senderId: 'other',
      timestamp: new Date(Date.now() - 1200000),
      isRead: true,
      type: 'text',
    },
    {
      id: '8',
      text: "Great! Also, don't forget about the team meeting tomorrow at 10 AM.",
      senderId: 'me',
      timestamp: new Date(Date.now() - 1200000),
      isRead: true,
      type: 'text',
    },
    {
      id: '9',
      text: "Great! Also, don't forget about the team meeting tomorrow at 10 AM.",
      senderId: 'other',
      timestamp: new Date(Date.now() - 1200000),
      isRead: true,
      type: 'text',
    },
    {
      id: '10',
      text: "Great! Also, don't forget about the team meeting tomorrow at 10 AM.",
      senderId: 'other',
      timestamp: new Date(Date.now() - 1200000),
      isRead: true,
      type: 'text',
    },
    {
      id: '11',
      text: "Great! Also, don't forget about the team meeting tomorrow at 10 AM.",
      senderId: 'other',
      timestamp: new Date(Date.now() - 1200000),
      isRead: true,
      type: 'text',
    },
    {
      id: '12',
      text: "Great! Also, don't forget about the team meeting tomorrow at 10 AM.",
      senderId: 'other',
      timestamp: new Date(Date.now() - 1200000),
      isRead: true,
      type: 'text',
    },
  ];

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    setLoading(true);
    setTimeout(() => {
      setMessages(mockMessages);
      setLoading(false);
    }, 500);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    // <MessageBubble
    //   message={item}
    //   isOwnMessage={item.senderId === 'me'}
    //   isDarkMode={isDarkMode}
    // />

    <MessageLayout
      message={item}
      isOwnMessage={item.senderId === 'me'}
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
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[isDarkMode ? '#00A884' : '#008069']}
              tintColor={isDarkMode ? '#00A884' : '#008069'}
            />
          }
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
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