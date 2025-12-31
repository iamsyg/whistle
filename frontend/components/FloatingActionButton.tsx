// // components/FloatingActionButton.tsx
// import React from 'react';
// import {
//   TouchableOpacity,
//   StyleSheet,
//   ViewStyle,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { router } from 'expo-router';

// interface FloatingActionButtonProps {
//   href: any; // Use 'any' to bypass TypeScript strict typing
//   iconName?: keyof typeof Ionicons.glyphMap;
//   backgroundColor?: string;
//   size?: number;
//   bottom?: number;
//   right?: number;
//   left?: number;
//   top?: number;
//   style?: ViewStyle;
// }

// const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
//   href,
//   iconName = 'add',
//   backgroundColor = '#1971c2',
//   size = 56,
//   bottom = 80,
//   right = 24,
//   left,
//   top,
//   style,
// }) => {
//   const handlePress = () => {
//     router.push(href);
//   };

//   return (
//     <TouchableOpacity
//       style={[
//         styles.button,
//         {
//           backgroundColor,
//           width: size,
//           height: size,
//           borderRadius: size / 2,
//           bottom,
//           right,
//           left,
//           top,
//         },
//         style,
//       ]}
//       onPress={handlePress}
//       activeOpacity={0.8}
//     >
//       <Ionicons 
//         name={iconName} 
//         size={size * 0.5}
//         color="#FFFFFF" 
//       />
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   button: {
//     position: 'absolute',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//     zIndex: 1000,
//   },
// });

// export default FloatingActionButton;



// components/FloatingActionButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface FloatingActionButtonProps {
  href?: any;
  onPress?: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
  size?: number;
  bottom?: number;
  right?: number;
  left?: number;
  top?: number;
  style?: ViewStyle;
  label?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  href,
  onPress,
  iconName = 'add',
  backgroundColor = '#1971c2',
  size = 56,
  bottom = 30,
  right = 24,
  left,
  top,
  style,
  label,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          width: size,
          height: size,
          borderRadius: size / 2,
          bottom,
          right,
          left,
          top,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Ionicons 
        name={iconName} 
        size={size * 0.5}
        color="#FFFFFF" 
      />
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  label: {
    position: 'absolute',
    bottom: -25,
    fontSize: 12,
    fontWeight: '600',
    color: '#1971c2',
  },
});

export default FloatingActionButton;