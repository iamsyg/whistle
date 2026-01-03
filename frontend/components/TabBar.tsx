// // components/TabBar.tsx
// import React, { useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Animated,
//   Dimensions,
//   PanResponder,
// } from 'react-native';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

// interface TabBarProps {
//   activeTab: 'chats' | 'tasks' | 'splits';
//   onTabChange: (tab: 'chats' | 'tasks' | 'splits') => void;
//   isDarkMode?: boolean;
// }

// const TabBar: React.FC<TabBarProps> = ({
//   activeTab,
//   onTabChange,
//   isDarkMode = false,
// }) => {
//   const indicatorAnim = useRef(new Animated.Value(0)).current;
//   const panResponder = useRef(
//     PanResponder.create({
//       onMoveShouldSetPanResponder: (_, gestureState) => {
//         return Math.abs(gestureState.dx) > 10;
//       },
//       onPanResponderRelease: (_, gestureState) => {
//         if (gestureState.dx > 50) {
//           // Swipe right
//           if (activeTab === 'tasks') onTabChange('chats');
//           if (activeTab === 'splits') onTabChange('tasks');
//         } else if (gestureState.dx < -50) {
//           // Swipe left
//           if (activeTab === 'chats') onTabChange('tasks');
//           if (activeTab === 'tasks') onTabChange('splits');
//         }
//       },
//     })
//   ).current;

//   const tabs = [
//     { id: 'chats', label: 'Chats' },
//     { id: 'tasks', label: 'Tasks' },
//     { id: 'splits', label: 'Splits' },
//   ] as const;

//   const indicatorPosition = {
//     chats: 0,
//     tasks: SCREEN_WIDTH / 3,
//     splits: (SCREEN_WIDTH / 3) * 2,
//   };

//   useEffect(() => {
//     Animated.spring(indicatorAnim, {
//       toValue: indicatorPosition[activeTab],
//       useNativeDriver: true,
//       tension: 150,
//       friction: 20,
//     }).start();
//   }, [activeTab]);

//   const theme = {
//     light: {
//       background: '#FFFFFF',
//       text: '#000000',
//       textSecondary: '#666666',
//       border: '#E0E0E0',
//       active: '#008069',
//     },
//     dark: {
//       background: '#1F2C34',
//       text: '#FFFFFF',
//       textSecondary: '#A0A0A0',
//       border: '#2A3942',
//       active: '#00A884',
//     },
//   };

//   const colors = isDarkMode ? theme.dark : theme.light;

//   return (
//     <View 
//       style={[styles.container, { backgroundColor: colors.background }]} 
//       {...panResponder.panHandlers}
//     >
//       <View style={styles.tabsContainer}>
//         {tabs.map((tab) => (
//           <TouchableOpacity
//             key={tab.id}
//             style={styles.tabButton}
//             onPress={() => onTabChange(tab.id)}
//             activeOpacity={0.7}
//           >
//             <Text
//               style={[
//                 styles.tabText,
//                 {
//                   color: activeTab === tab.id ? colors.active : colors.textSecondary,
//                   fontWeight: activeTab === tab.id ? '600' : '400',
//                 },
//               ]}
//             >
//               {tab.label}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>
      
//       <Animated.View
//         style={[
//           styles.indicator,
//           {
//             backgroundColor: colors.active,
//             transform: [{ translateX: indicatorAnim }],
//           },
//         ]}
//       />
      
//       <View style={[styles.divider, { backgroundColor: colors.border }]} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     height: 48,
//     borderBottomWidth: 1,
//   },
//   tabsContainer: {
//     flex: 1,
//     flexDirection: 'row',
//   },
//   tabButton: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   tabText: {
//     fontSize: 14,
//     letterSpacing: -0.2,
//   },
//   indicator: {
//     position: 'absolute',
//     bottom: 0,
//     width: SCREEN_WIDTH / 3,
//     height: 2,
//     borderRadius: 1,
//   },
//   divider: {
//     height: 1,
//     width: '100%',
//     position: 'absolute',
//     bottom: 0,
//   },
// });

// export default TabBar;




// components/TabBar.tsx (fixed version)
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabBarProps {
  activeTab: 'chats' | 'tasks' | 'splits';
  onTabChange: (tab: 'chats' | 'tasks' | 'splits') => void;
  isDarkMode?: boolean;
}

const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  isDarkMode = false,
}) => {
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          // Swipe right
          if (activeTab === 'tasks') onTabChange('chats');
          if (activeTab === 'splits') onTabChange('tasks');
        } else if (gestureState.dx < -50) {
          // Swipe left
          if (activeTab === 'chats') onTabChange('tasks');
          if (activeTab === 'tasks') onTabChange('splits');
        }
      },
    })
  ).current;

  const tabs = [
    { id: 'chats', label: 'Chats' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'splits', label: 'Splits' },
  ] as const;

  const indicatorPosition = {
    chats: 0,
    tasks: SCREEN_WIDTH / 3,
    splits: (SCREEN_WIDTH / 3) * 2,
  };

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: indicatorPosition[activeTab],
      useNativeDriver: true,
      tension: 150,
      friction: 20,
    }).start();
  }, [activeTab]);

  const theme = {
    light: {
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
      border: '#E0E0E0',
      active: '#008069',
    },
    dark: {
      background: '#1F2C34',
      text: '#FFFFFF',
      textSecondary: '#A0A0A0',
      border: '#2A3942',
      active: '#00A884',
    },
  };

  const colors = isDarkMode ? theme.dark : theme.light;

  return (
    <View 
      style={[styles.container, { backgroundColor: colors.background }]} 
      {...panResponder.panHandlers}
    >
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab.id ? colors.active : colors.textSecondary,
                  fontWeight: activeTab === tab.id ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.active,
            transform: [{ translateX: indicatorAnim }],
          },
        ]}
      />
      
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderBottomWidth: 1,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH / 3,
    height: 2,
    borderRadius: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
});

export default TabBar;