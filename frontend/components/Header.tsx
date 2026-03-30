// frontend/components/Header.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeaderProps {
  title?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  menuItems?: Array<{
    id: string;
    label: string;
    icon: string;
    onPress: () => void;
  }>;
}

const Header: React.FC<HeaderProps> = ({
  title = 'Chats',
  searchPlaceholder = 'Search...',
  onSearch = (query) => console.log('Search:', query),
  showSearch = true,
  showBackButton = false,
  onBackPress = () => console.log('Back pressed'),
  menuItems = [
    { id: '1', label: 'Profile', icon: 'person-outline', onPress: () => router.push('/(screens)/profileScreen') },
    { id: '2', label: 'Settings', icon: 'settings-outline', onPress: () => router.push('/(screens)/settings/settingsScreen') },
    { id: '3', label: 'Splits / Expenses', icon: 'receipt-outline', onPress: () => console.log('Splits pressed') },
    { id: '4', label: 'Help / Support', icon: 'help-circle-outline', onPress: () => console.log('Help pressed') },
  ],
}) => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchHeight, setSearchHeight] = useState(28);

  // Animations
  const searchWidthAnim = useRef(new Animated.Value(0)).current;
  const searchOpacityAnim = useRef(new Animated.Value(0)).current;
  const containerHeightAnim = useRef(new Animated.Value(44)).current;
  const menuScaleAnim = useRef(new Animated.Value(0)).current;
  const menuOpacityAnim = useRef(new Animated.Value(0)).current;

  // Calculate search bar max width (stop before Whistle text)
  const calculateSearchWidth = () => {
    const rightIconsWidth = 80; // search icon + menu icon
    const appNameWidth = 100; // Approximate width for "Whistle"
    const leftPadding = showBackButton ? 60 : 16;
    const spacing = 16;
    return SCREEN_WIDTH - leftPadding - appNameWidth - rightIconsWidth - spacing * 2;
  };

  const maxSearchWidth = calculateSearchWidth();

  const toggleSearch = () => {
    if (!isSearchActive) {
      // Activate search
      setIsSearchActive(true);
      Animated.parallel([
        Animated.spring(searchWidthAnim, {
          toValue: maxSearchWidth,
          useNativeDriver: false,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(searchOpacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Deactivate search
      Animated.parallel([
        Animated.timing(searchWidthAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(searchOpacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(containerHeightAnim, {
          toValue: 44,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setIsSearchActive(false);
        setSearchQuery('');
        setSearchHeight(28);
        onSearch('');
      });
    }
  };

  // Menu animation - WhatsApp style
  const toggleMenu = (visible: boolean) => {
    if (visible) {
      setIsMenuVisible(true);
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
        setIsMenuVisible(false);
      });
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  const handleMenuItemPress = (item: any) => {
    toggleMenu(false);
    setTimeout(() => item.onPress(), 150);
  };

  // Handle search box height change
  const handleContentSizeChange = (contentWidth: number, contentHeight: number) => {
    const minHeight = 28;
    const maxHeight = 90;
    const newHeight = Math.min(Math.max(contentHeight + 12, minHeight), maxHeight);
    
    if (newHeight !== searchHeight) {
      setSearchHeight(newHeight);
      const newContainerHeight = Math.max(44, newHeight + 16);
      Animated.timing(containerHeightAnim, {
        toValue: newContainerHeight,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { height: containerHeightAnim }]}>
        {/* Left Section - App Name (Always visible) */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#1971c2" />
            </TouchableOpacity>
          )}

          <View style={styles.titleContainer}>
            <Text style={styles.appName}>Whistle</Text>
          </View>
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {/* Animated Search Bar (expands from right to left) */}
          <Animated.View
            style={[
              styles.searchContainer,
              {
                width: searchWidthAnim,
                opacity: searchOpacityAnim,
                minHeight: 28,
                maxHeight: 90,
              },
            ]}
            pointerEvents={isSearchActive ? 'auto' : 'none'}
          >
            <View style={styles.searchInputWrapper}>
              <Feather name="search" size={16} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus={isSearchActive}
                selectionColor="#1971c2"
                multiline={true}
                onContentSizeChange={(e) => 
                  handleContentSizeChange(
                    e.nativeEvent.contentSize.width,
                    e.nativeEvent.contentSize.height
                  )
                }
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={16} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Search Icon */}
          {showSearch && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={toggleSearch}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isSearchActive ? "close" : "search"}
                size={20} 
                color="#1971c2" 
              />
            </TouchableOpacity>
          )}

          {/* Three-dot menu button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => toggleMenu(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name="more-vert" 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        <Modal
          transparent={true}
          visible={isMenuVisible}
          animationType="none"
          onRequestClose={() => toggleMenu(false)}
        >
          <TouchableWithoutFeedback onPress={() => toggleMenu(false)}>
            <View style={styles.menuOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.menuContainer,
                    {
                      transform: [{ scale: menuScaleAnim }],
                      opacity: menuOpacityAnim,
                    },
                  ]}
                >
                  {menuItems.map((item, index) => (
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
          </TouchableWithoutFeedback>
        </Modal>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1971c2',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    marginTop: -2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  searchContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 4,
    justifyContent: 'center',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: {
    marginRight: 6,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingVertical: 0,
    paddingRight: 6,
    lineHeight: 18,
    textAlignVertical: 'center',
  },
  clearButton: {
    padding: 2,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 54 : 48,
    paddingRight: 8,
  },
  menuContainer: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    transformOrigin: 'top right',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuIcon: {
    marginRight: 12,
    width: 24,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
});

export default Header;