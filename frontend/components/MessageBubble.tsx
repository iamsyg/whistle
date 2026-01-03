// components/MessageBubble.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageBubbleProps {
  message: {
    id: string;
    text: string;
    senderId: string;
    timestamp: Date;
    isRead: boolean;
    type: 'text' | 'image' | 'document' | 'task' | 'split';
    metadata?: any;
  };
  isOwnMessage: boolean;
  isDarkMode?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  isDarkMode = false,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const theme = {
    light: {
      ownBubble: '#DCF8C6',
      otherBubble: '#FFFFFF',
      ownText: '#000000',
      otherText: '#000000',
      timeText: '#666666',
      bubbleShadow: '#00000010',
    },
    dark: {
      ownBubble: '#005C4B',
      otherBubble: '#2A3942',
      ownText: '#FFFFFF',
      otherText: '#E9EDEF',
      timeText: '#A0A0A0',
      bubbleShadow: '#00000030',
    },
  };

  const colors = isDarkMode ? theme.dark : theme.light;

  const renderContent = () => {
    switch (message.type) {
      case 'task':
        return (
          <View style={styles.taskContainer}>
            <View style={styles.taskHeader}>
              <Ionicons name="checkbox-outline" size={20} color={colors.ownText} />
              <Text style={[styles.taskTitle, { color: colors.ownText }]}>
                {message.metadata?.title || 'Task'}
              </Text>
            </View>
            <Text style={[styles.taskDescription, { color: colors.timeText }]}>
              {message.text}
            </Text>
            {message.metadata?.dueDate && (
              <Text style={[styles.taskDueDate, { color: colors.timeText }]}>
                Due: {new Date(message.metadata.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        );
      
      case 'split':
        return (
          <View style={styles.splitContainer}>
            <View style={styles.splitHeader}>
              <Ionicons name="receipt-outline" size={20} color={colors.ownText} />
              <Text style={[styles.splitTitle, { color: colors.ownText }]}>
                {message.metadata?.description || 'Expense Split'}
              </Text>
            </View>
            <Text style={[styles.splitAmount, { color: colors.ownText }]}>
              ₹{message.metadata?.amount?.toLocaleString() || '0'}
            </Text>
            <Text style={[styles.splitStatus, { color: colors.timeText }]}>
              Status: {message.metadata?.status || 'Pending'}
            </Text>
          </View>
        );
      
      default:
        return (
          <Text style={[styles.messageText, { color: isOwnMessage ? colors.ownText : colors.otherText }]}>
            {message.text}
          </Text>
        );
    }
  };

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownContainer : styles.otherContainer,
    ]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isOwnMessage ? colors.ownBubble : colors.otherBubble,
            shadowColor: colors.bubbleShadow,
            alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        {renderContent()}
        <View style={styles.footer}>
          <Text style={[styles.timeText, { color: colors.timeText }]}>
            {formatTime(message.timestamp)}
          </Text>
          {isOwnMessage && (
            <Ionicons
              name={message.isRead ? "checkmark-done" : "checkmark"}
              size={14}
              color={message.isRead ? '#53BDEB' : colors.timeText}
              style={styles.readIndicator}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    marginRight: 4,
  },
  readIndicator: {
    marginLeft: 2,
  },
  taskContainer: {
    paddingVertical: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  taskDueDate: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  splitContainer: {
    paddingVertical: 4,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  splitAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  splitStatus: {
    fontSize: 12,
  },
});

export default MessageBubble;