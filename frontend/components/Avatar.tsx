import React from 'react';
import {
  StyleSheet,
  View,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  size?: number;
  source?: string | null;
  onPress?: () => void;
  showCameraOverlay?: boolean;
  editable?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  size = 120,
  source,
  onPress,
  showCameraOverlay = true,
  editable = true,
}) => {
  const avatarSize = { width: size, height: size, borderRadius: size / 2 };

  return (
    <TouchableOpacity
      style={[styles.container, avatarSize]}
      onPress={editable ? onPress : undefined}
      activeOpacity={editable ? 0.8 : 1}
      disabled={!editable}
    >
      {source ? (
        <ImageBackground
          source={{ uri: source }}
          style={[styles.image, avatarSize]}
          imageStyle={avatarSize}
        >
          {editable && showCameraOverlay && (
            <View style={[styles.overlay, avatarSize]}>
              <Ionicons name="camera" size={size * 0.2} color="#fff" />
            </View>
          )}
        </ImageBackground>
      ) : (
        <View style={[styles.defaultAvatar, avatarSize]}>
          <Ionicons name="person" size={size * 0.33} color="#1971c2" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatar: {
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e7f5ff',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default Avatar;