import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const AppLogo: React.FC<AppLogoProps> = ({ 
  size = 'large', 
  color = '#1971c2' 
}) => {
  const sizeMap = {
    small: 40,
    medium: 60,
    large: 80,
  };

  return (
    <View style={[styles.logoContainer, { width: sizeMap[size], height: sizeMap[size] }]}>
      <View style={[styles.logoCircle, { borderColor: color }]}>
        <Text style={[styles.logoText, { color }]}>A</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});

export default AppLogo;