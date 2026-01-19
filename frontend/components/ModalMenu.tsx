// components/ModalMenu.tsx - Simplified version
import React, { useRef } from 'react';
import {
  Modal,
  TouchableWithoutFeedback,
  View,
  Animated,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface MenuItem {
  id: string | number;
  label: string;
  icon: string;
  onPress: () => void;
}

interface ModalMenuProps {
  visible: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  menuWidth?: number;
}

const ModalMenu: React.FC<ModalMenuProps> = ({
  visible,
  onClose,
  menuItems,
  menuWidth = 220,
}) => {
  const menuScaleAnim = useRef(new Animated.Value(0)).current;
  const menuOpacityAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = (shouldShow: boolean) => {
    if (shouldShow) {
      // Reset initial values for opening animation
      menuScaleAnim.setValue(0);
      menuOpacityAnim.setValue(0);
      
      Animated.parallel([
        Animated.spring(menuScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 18,
          velocity: 2,
        }),
        Animated.timing(menuOpacityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(menuScaleAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(menuOpacityAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClose();
      });
    }
  };

  const handleMenuItemPress = (item: MenuItem) => {
    toggleMenu(false);
    setTimeout(() => item.onPress(), 150);
  };

  // Control animation when visibility changes
  React.useEffect(() => {
    if (visible) {
      toggleMenu(true);
    } else {
      toggleMenu(false);
    }
  }, [visible]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.menuOverlay}>
          <View style={styles.menuWrapper}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.menuContainer,
                  {
                    transform: [{ scale: menuScaleAnim }],
                    opacity: menuOpacityAnim,
                    width: menuWidth,
                  },
                ]}
              >
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuItem}
                    onPress={() => handleMenuItemPress(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color="#666" 
                      style={styles.menuIcon} 
                    />
                    <Text style={styles.menuItemText}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 100,
    paddingRight: 24,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default ModalMenu;