// components/MessagingHeader.tsx (fixed version)
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
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MessagingHeaderProps {
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showSearch?: boolean;
  showCall?: boolean;
  showMenu?: boolean;
  onCallPress?: () => void;
  onMenuPress?: () => void;
  isDarkMode?: boolean;
  onPress?: () => void;
}

const MessagingHeader: React.FC<MessagingHeaderProps> = ({
  title = 'Chat',
  subtitle = 'last seen today at 4:59 PM',
  searchPlaceholder = 'Search messages...',
  onSearch = (query) => console.log('Search:', query),
  showBackButton = true,
  onBackPress = () => console.log('Back pressed'),
  showSearch = true,
  showCall = true,
  showMenu = true,
  onCallPress = () => console.log('Call pressed'),
  onMenuPress = () => console.log('Menu pressed'),
  isDarkMode = false,
  onPress,
}) => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Animations - using LayoutAnimation instead for width
  const searchOpacityAnim = useRef(new Animated.Value(0)).current;
  const titleOpacityAnim = useRef(new Animated.Value(1)).current;
  const searchScaleAnim = useRef(new Animated.Value(0)).current;
  const rightIconsAnim = useRef(new Animated.Value(1)).current;

  const colors = {
    light: {
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
      border: '#E0E0E0',
      icon: '#666666',
      searchBackground: '#F0F2F5',
      active: '#008069',
    },
    dark: {
      background: '#1F2C34',
      text: '#FFFFFF',
      textSecondary: '#A0A0A0',
      border: '#2A3942',
      icon: '#A0A0A0',
      searchBackground: '#2A3942',
      active: '#00A884',
    },
  };

  const theme = isDarkMode ? colors.dark : colors.light;

  const toggleSearch = (active: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (active) {
      setIsSearchActive(true);
      Animated.parallel([
        Animated.spring(searchScaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 20,
          useNativeDriver: true,
        }),
        Animated.timing(searchOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rightIconsAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(searchScaleAnim, {
          toValue: 0,
          tension: 150,
          friction: 20,
          useNativeDriver: true,
        }),
        Animated.timing(searchOpacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rightIconsAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsSearchActive(false);
        setSearchQuery('');
        onSearch('');
      });
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  const rightIconsOpacity = rightIconsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const searchTransform = [
    {
      scaleX: searchScaleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={theme.icon} />
            </TouchableOpacity>
          )}

          {/* Title (hidden when search is active) */}
          {!isSearchActive && (
            // <Animated.View style={[styles.titleContainer, { opacity: titleOpacityAnim }]}>
            //   <View>
            //     <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            //       {title}
            //     </Text>
            //     {subtitle && (
            //       <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            //         {subtitle}
            //       </Text>
            //     )}
            //   </View>
            // </Animated.View>
            <Animated.View style={[styles.titleContainer, { opacity: titleOpacityAnim }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                disabled={!onPress}
              >
                <View>
                  <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                    {title}
                  </Text>
                  {subtitle && (
                    <Text
                      style={[styles.subtitle, { color: theme.textSecondary }]}
                      numberOfLines={1}
                    >
                      {subtitle}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Search Bar */}
          {isSearchActive && (
            <Animated.View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: theme.searchBackground,
                  opacity: searchOpacityAnim,
                  transform: searchTransform,
                },
              ]}
            >
              <View style={styles.searchInputWrapper}>
                <Feather name="search" size={18} color={theme.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={theme.textSecondary}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoFocus
                  selectionColor={theme.active}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}
        </View>

        {/* Right Icons */}
        <Animated.View style={[styles.rightSection, { opacity: rightIconsOpacity }]}>
          {showSearch && !isSearchActive && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => toggleSearch(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={22} color={theme.icon} />
            </TouchableOpacity>
          )}

          {showSearch && isSearchActive && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => toggleSearch(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={theme.icon} />
            </TouchableOpacity>
          )}

          {showCall && !isSearchActive && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onCallPress}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={22} color={theme.icon} />
            </TouchableOpacity>
          )}

          {showMenu && !isSearchActive && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onMenuPress}
              activeOpacity={0.7}
            >
              <MaterialIcons name="more-vert" size={24} color={theme.icon} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 56,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchContainer: {
    borderRadius: 18,
    height: 36,
    overflow: 'hidden',
    marginLeft: 8,
    flex: 1,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingRight: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
});

export default MessagingHeader;