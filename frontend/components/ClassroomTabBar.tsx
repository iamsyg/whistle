import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';

type TabType = 'chats' | 'announcements' | 'assignments';

interface ClassroomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isDarkMode?: boolean;
}

const ClassroomTabBar: React.FC<ClassroomTabBarProps> = ({
  activeTab,
  onTabChange,
  isDarkMode = false,
}) => {
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  
  const tabs = useMemo(
    () => [
      { id: 'chats' as TabType, label: 'Chats' },
      { id: 'announcements' as TabType, label: 'Announcements' },
      { id: 'assignments' as TabType, label: 'Assignments' },
    ],
    []
  );

  const tabWidth = containerWidth / tabs.length || 0;

  const indicatorPosition = useMemo(() => {
    const positions: Record<TabType, number> = {
      chats: 0,
      announcements: tabWidth,
      assignments: tabWidth * 2,
    };
    return positions;
  }, [tabWidth]);

  // Create pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        // Only respond to horizontal swipes
        return Math.abs(dx) > Math.abs(dy) * 2 && Math.abs(dx) > 10;
      },
      onPanResponderRelease: (_, { dx }) => {
        const swipeThreshold = 50;
        
        if (dx > swipeThreshold) {
          // Swipe right - go to previous tab
          switch (activeTab) {
            case 'announcements':
              onTabChange('chats');
              break;
            case 'assignments':
              onTabChange('announcements');
              break;
          }
        } else if (dx < -swipeThreshold) {
          // Swipe left - go to next tab
          switch (activeTab) {
            case 'chats':
              onTabChange('announcements');
              break;
            case 'announcements':
              onTabChange('assignments');
              break;
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!containerWidth) return;

    // Animate indicator to the active tab position
    Animated.timing(indicatorAnim, {
      toValue: indicatorPosition[activeTab],
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [activeTab, indicatorPosition, containerWidth]);

  const theme = {
    light: {
      background: '#FFFFFF',
      textSecondary: '#666666',
      border: '#E0E0E0',
      active: '#008069',
    },
    dark: {
      background: '#1F2C34',
      textSecondary: '#A0A0A0',
      border: '#2A3942',
      active: '#00A884',
    },
  };

  const colors = isDarkMode ? theme.dark : theme.light;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <View style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, { width: tabWidth }]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === tab.id
                      ? colors.active
                      : colors.textSecondary,
                  fontWeight: activeTab === tab.id ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth,
              backgroundColor: colors.active,
              transform: [{ translateX: indicatorAnim }],
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderBottomWidth: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  tabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  tabText: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
});

export default ClassroomTabBar;