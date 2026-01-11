// components/ChatInput.tsx 

import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  Animated,
  Text,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface ChatInputProps {
  onSend: (message: string) => void;
  onAttachmentPress: () => void;
  isDarkMode?: boolean;
  onTyping?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onAttachmentPress,
  isDarkMode = false,
  onTyping,
}) => {
  const [message, setMessage] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
      // Keyboard.dismiss();
    }
  };

  const handleChangeText = (text: string) => {
    setMessage(text);
    if (onTyping && text.length > 0) {
      onTyping();
    }
  };


  const handleAttachment = () => {
    onAttachmentPress();
  };

  const handleContentSizeChange = (event: any) => {
    const height = Math.min(100, Math.max(40, event.nativeEvent.contentSize.height));
    setInputHeight(height);
  };

  const theme = {
    light: {
      background: '#FFFFFF',
      inputBackground: '#F0F2F5',
      text: '#000000',
      textSecondary: '#666666',
      border: '#E0E0E0',
      active: '#008069',
      icon: '#666666',
    },
    dark: {
      background: '#1F2C34',
      inputBackground: '#2A3942',
      text: '#FFFFFF',
      textSecondary: '#A0A0A0',
      border: '#2A3942',
      active: '#00A884',
      icon: '#A0A0A0',
    },
  };

  const colors = isDarkMode ? theme.dark : theme.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top border */}
      <View style={[styles.topBorder, { backgroundColor: colors.border }]} />

      <View style={styles.inputContainer}>
        {/* Attachment/Plus Button */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.inputBackground }]}
          onPress={handleAttachment}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={colors.icon} />
        </TouchableOpacity>

        {/* Text Input */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, height: inputHeight }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={message}
            onChangeText={handleChangeText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={1000}
            onContentSizeChange={handleContentSizeChange}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.emojiButton, { backgroundColor: colors.inputBackground }]}
            activeOpacity={0.7}
          >
            <Ionicons name="happy-outline" size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Send Button or Mic Button */}
        {message.trim() ? (
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.active }]}
            onPress={handleSend}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.inputBackground }]}
            activeOpacity={0.7}
          >
            <Ionicons name="mic-outline" size={24} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions Row (only visible when no keyboard) */}
      {/* {!isKeyboardVisible && (
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={20} color={colors.icon} />
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>
              Camera
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
            <Ionicons name="document-outline" size={20} color={colors.icon} />
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>
              Document
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
            <Ionicons name="image-outline" size={20} color={colors.icon} />
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>
              Gallery
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
            <Ionicons name="location-outline" size={20} color={colors.icon} />
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>
              Location
            </Text>
          </TouchableOpacity>
        </View>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    // borderTopWidth: 1,
  },
  topBorder: {
    // height: 1,
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 20,
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 40,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingRight: 8,
  },
  emojiButton: {
    padding: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  quickAction: {
    alignItems: 'center',
    padding: 8,
  },
  quickActionText: {
    fontSize: 10,
    marginTop: 4,
  },
});

export default ChatInput;