// components/AttachmentSheet.tsx
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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AttachmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
  isDarkMode?: boolean;
}

const AttachmentSheet: React.FC<AttachmentSheetProps> = ({
  visible,
  onClose,
  onSelect,
  isDarkMode = false,
}) => {
  const attachmentOptions = [
    {
      id: 'gallery',
      label: 'Gallery',
      icon: 'image-outline',
      iconType: 'ionicons',
      description: 'Photos & videos',
    },
    {
      id: 'camera',
      label: 'Camera',
      icon: 'camera-outline',
      iconType: 'ionicons',
      description: 'Take photo or video',
    },
    {
      id: 'document',
      label: 'Document',
      icon: 'document-outline',
      iconType: 'ionicons',
      description: 'Files & documents',
    },
    {
      id: 'contact',
      label: 'Contact',
      icon: 'person-outline',
      iconType: 'ionicons',
      description: 'Share a contact',
    },
    {
      id: 'location',
      label: 'Location',
      icon: 'location-outline',
      iconType: 'ionicons',
      description: 'Share your location',
    },
    {
      id: 'task',
      label: 'Task',
      icon: 'checkbox-outline',
      iconType: 'ionicons',
      description: 'Assign a task',
    },
    {
      id: 'split',
      label: 'Split',
      icon: 'receipt-outline',
      iconType: 'ionicons',
      description: 'Create expense split',
    },
  ];

  const theme = {
    light: {
      background: '#FFFFFF',
      backdrop: 'rgba(0, 0, 0, 0.5)',
      text: '#000000',
      textSecondary: '#666666',
      border: '#E0E0E0',
      itemBackground: '#F8F9FA',
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

  const renderIcon = (icon: string, iconType: string) => {
    if (iconType === 'ionicons') {
      return <Ionicons name={icon as any} size={28} color={isDarkMode ? '#00A884' : '#008069'} />;
    }
    return <MaterialIcons name={icon as any} size={28} color={isDarkMode ? '#00A884' : '#008069'} />;
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
              Choose an attachment
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Select what you'd like to share
            </Text>
          </View>

          {/* Options Grid */}
          <View style={styles.optionsGrid}>
            {attachmentOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  { backgroundColor: colors.itemBackground, borderColor: colors.border },
                ]}
                onPress={() => onSelect(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  {renderIcon(option.icon, option.iconType)}
                </View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.itemBackground }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: isDarkMode ? '#FF3B30' : '#FF3B30' }]}>
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  optionItem: {
    width: (SCREEN_WIDTH - 48) / 3,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  optionIcon: {
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 11,
    textAlign: 'center',
  },
  cancelButton: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AttachmentSheet;