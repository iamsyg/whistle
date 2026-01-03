// components/MenuSheet.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MenuSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: string) => void;
  isDarkMode?: boolean;
}

const MenuSheet: React.FC<MenuSheetProps> = ({
  visible,
  onClose,
  onSelect,
  isDarkMode = false,
}) => {
  const menuItems = [
    {
      id: 'profile',
      label: 'View Profile',
      icon: 'person-outline' as const,
      color: '#007AFF',
    },
    {
      id: 'mute',
      label: 'Mute Notifications',
      icon: 'notifications-off-outline' as const,
      color: '#FF9500',
    },
    {
      id: 'search',
      label: 'Search Messages',
      icon: 'search-outline' as const,
      color: '#34C759',
    },
    {
      id: 'clear',
      label: 'Clear Chat',
      icon: 'trash-outline' as const,
      color: '#FF3B30',
    },
    {
      id: 'export',
      label: 'Export Chat',
      icon: 'download-outline' as const,
      color: '#5856D6',
    },
    {
      id: 'block',
      label: 'Block User',
      icon: 'ban-outline' as const,
      color: '#FF3B30',
    },
    {
      id: 'report',
      label: 'Report User',
      icon: 'warning-outline' as const,
      color: '#FF9500',
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

  const handleItemPress = (itemId: string) => {
    onSelect(itemId);
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
              Chat Options
            </Text>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, { 
                  backgroundColor: colors.itemBackground,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }]}
                onPress={() => handleItemPress(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons 
                    name={item.icon} 
                    size={22} 
                    color={item.color} 
                  />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
                <Ionicons 
                  name="chevron-forward-outline" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

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
    maxHeight: SCREEN_HEIGHT * 0.8,
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  menuList: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});

export default MenuSheet;