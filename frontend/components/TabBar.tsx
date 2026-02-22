// components/TabBar.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  ViewStyle,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
}

interface TabBarProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  isDarkMode?: boolean;
  width?: number;
  height?: number;
  activeColor?: string;
  style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// useTabSwipe
//
// Returns:
//   panHandlers  – spread onto the CONTENT view (not the tab bar strip)
//   translateX   – Animated.Value driving the page strip position
//                  Pass this to SwipeableTabContent (see below)
//
// How it works:
//   • All tab views sit side-by-side in a row that is (tabs.length * SCREEN_WIDTH) wide.
//   • translateX normally sits at -(activeIndex * SCREEN_WIDTH).
//   • While the finger is down we add gestureState.dx directly so the content
//     tracks the finger 1:1.
//   • On release we spring-snap to the nearest valid page.
// ─────────────────────────────────────────────────────────────────────────────
export function useTabSwipe<T extends string>(
  tabs: TabItem<T>[],
  activeTab: T,
  onTabChange: (tab: T) => void,
  screenWidth: number = SCREEN_WIDTH,
) {
  const stateRef = useRef({ activeTab, tabs, onTabChange, screenWidth });
  useEffect(() => {
    stateRef.current = { activeTab, tabs, onTabChange, screenWidth };
  });

  // The single animated value that drives the whole page strip
  const translateX = useRef(new Animated.Value(0)).current;

  // Snap translateX to the current activeTab whenever it changes from outside
  // (e.g. tapping a tab button)
  useEffect(() => {
    const idx = tabs.findIndex(t => t.id === activeTab);
    Animated.spring(translateX, {
      toValue: -(idx * screenWidth),
      useNativeDriver: true,
      tension: 120,
      friction: 20,
      overshootClamping: false,
    }).start();
  }, [activeTab, screenWidth]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      // Claim only clearly horizontal gestures
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) * 2 && Math.abs(gs.dx) > 6,
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) * 2 && Math.abs(gs.dx) > 6,

      onPanResponderGrant: () => {
        // Stop any in-flight animation and capture current value
        translateX.stopAnimation();
        // @ts-ignore – _value is internal but reliable
        translateX.setOffset(translateX._value);
        translateX.setValue(0);
      },

      onPanResponderMove: (_, gs) => {
        const { tabs: curTabs, activeTab: curTab, screenWidth: sw } = stateRef.current;
        const idx = curTabs.findIndex(t => t.id === curTab);
        const isFirst = idx === 0;
        const isLast  = idx === curTabs.length - 1;

        // Apply rubber-band resistance at the edges
        let dx = gs.dx;
        if ((isFirst && dx > 0) || (isLast && dx < 0)) {
          dx = dx * 0.2; // heavy rubber-band
        }

        translateX.setValue(dx);
      },

      onPanResponderRelease: (_, gs) => {
        translateX.flattenOffset();

        const { tabs: curTabs, activeTab: curTab, onTabChange: change, screenWidth: sw } =
          stateRef.current;
        const idx = curTabs.findIndex(t => t.id === curTab);

        // Decide whether to snap to next/prev based on distance OR velocity
        const SWIPE_THRESHOLD = sw * 0.25;
        const VELOCITY_THRESHOLD = 0.5;

        let targetIdx = idx;
        if ((gs.dx < -SWIPE_THRESHOLD || gs.vx < -VELOCITY_THRESHOLD) && idx < curTabs.length - 1) {
          targetIdx = idx + 1;
        } else if ((gs.dx > SWIPE_THRESHOLD || gs.vx > VELOCITY_THRESHOLD) && idx > 0) {
          targetIdx = idx - 1;
        }

        // Spring to target page
        Animated.spring(translateX, {
          toValue: -(targetIdx * sw),
          useNativeDriver: true,
          tension: 150,
          friction: 20,
          overshootClamping: false,
        }).start(() => {
          if (targetIdx !== idx) {
            change(curTabs[targetIdx].id);
          }
        });
      },

      onPanResponderTerminate: () => {
        // Snap back to current page if gesture is stolen
        translateX.flattenOffset();
        const { tabs: curTabs, activeTab: curTab, screenWidth: sw } = stateRef.current;
        const idx = curTabs.findIndex(t => t.id === curTab);
        Animated.spring(translateX, {
          toValue: -(idx * sw),
          useNativeDriver: true,
          tension: 150,
          friction: 20,
        }).start();
      },
    })
  ).current;

  return { panHandlers: panResponder.panHandlers, translateX };
}

// ─────────────────────────────────────────────────────────────────────────────
// SwipeableTabContent
//
// Renders all tab views side-by-side in a horizontal strip and moves the
// strip using the translateX value from useTabSwipe.
// Each child receives the full screen width.
//
// Usage:
//   <SwipeableTabContent translateX={translateX} screenWidth={screenWidth}>
//     <ChatsTab  />
//     <TasksTab  />
//     <SplitsTab />
//   </SwipeableTabContent>
// ─────────────────────────────────────────────────────────────────────────────
interface SwipeableTabContentProps {
  translateX: Animated.Value;
  screenWidth?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SwipeableTabContent({
  translateX,
  screenWidth = SCREEN_WIDTH,
  children,
  style,
}: SwipeableTabContentProps) {
  const childArray = React.Children.toArray(children);
  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          flex: 1,
          flexDirection: 'row',
          width: screenWidth * childArray.length,
          transform: [{ translateX }],
        }}
      >
        {childArray.map((child, i) => (
          <View key={i} style={{ width: screenWidth, flex: 1 }}>
            {child}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TabBar – visual strip + animated underline only
// ─────────────────────────────────────────────────────────────────────────────
function TabBar<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  isDarkMode = false,
  width = SCREEN_WIDTH,
  height = 48,
  activeColor,
  style,
}: TabBarProps<T>) {
  const tabWidth = width / tabs.length;
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    background:    isDarkMode ? '#1F2C34' : '#FFFFFF',
    textSecondary: isDarkMode ? '#A0A0A0' : '#666666',
    border:        isDarkMode ? '#2A3942' : '#E0E0E0',
    active:        activeColor ?? (isDarkMode ? '#00A884' : '#008069'),
  };

  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      tension: 150,
      friction: 20,
    }).start();
  }, [activeIndex, tabWidth]);

  return (
    <View style={[st.container, { backgroundColor: colors.background, height, width }, style]}>
      <View style={st.tabsContainer}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[st.tabButton, { width: tabWidth }]}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  st.tabText,
                  {
                    color:      isActive ? colors.active : colors.textSecondary,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Animated.View
        style={[
          st.indicator,
          {
            backgroundColor: colors.active,
            width: tabWidth,
            transform: [{ translateX: indicatorAnim }],
          },
        ]}
      />
      <View style={[st.divider, { backgroundColor: colors.border }]} />
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
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
    left: 0,
    height: 2,
    borderRadius: 1,
    zIndex: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    zIndex: 0,
  },
});

export default TabBar;