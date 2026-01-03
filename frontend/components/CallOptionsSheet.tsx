// components/CallOptionsSheet.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CallOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: string) => void;
  isDarkMode?: boolean;
}

const CallOptionsSheet: React.FC<CallOptionsSheetProps> = ({
  visible,
  onClose,
  onSelect,
  isDarkMode = false,
}) => {
  const callOptions = [
    {
      id: 'audio',
      label: 'Voice Call',
      icon: 'call-outline',
      description: 'Make an audio call',
      color: '#007AFF',
    },
    {
      id: 'video',
      label: 'Video Call',
      icon: 'videocam-outline',
      description: 'Make a video call',
      color: '#34C759',
    },
    {
      id: 'schedule',
      label: 'Schedule Call',
      icon: 'calendar-outline',
      description: 'Schedule for later',
      color: '#FF9500',
    },
    {
      id: 'call_record',
      label: 'Call Records',
      icon: 'recording-outline',
      description: 'View call history',
      color: '#5856D6',
    },
  ];

  const theme = {
    light: {
      background: '#FFFFFF',
      backdrop: 'rgba(0, 0, 0, 0.5)',
      text: '#000000',
      textSecondary: '#666666',
      border: '#E0E0E0',
      itemBackground: '#FFFFFF',
    },
    dark: {
      background: '#1F2C34',
      backdrop: 'rgba(0, 0, 0, 0.7)',
      text: '#FFFFFF',
      textSecondary: '#A0A0A0',
      border: '#2A3942',
      itemBackground: '#233138',
    },
  };

  const colors = isDarkMode ? theme.dark : theme.light;

  const handleOptionSelect = (optionId: string) => {
    onSelect(optionId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={[styles.backdrop, { backgroundColor: colors.backdrop }]}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={[styles.sheetContainer, { backgroundColor: colors.background }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.textSecondary }]} />
          </View>

          {/* Title */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Call Options
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choose a calling option
            </Text>
          </View>

          {/* Call Options */}
          <View style={styles.optionsContainer}>
            {callOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, { backgroundColor: colors.itemBackground }]}
                onPress={() => handleOptionSelect(option.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${option.color}15` }]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={28} 
                    color={option.color} 
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    {option.description}
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward-outline" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.itemBackground }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
  },
  cancelButton: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});

export default CallOptionsSheet;