// frontend/components/settings/ProfileCard.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileCardProps {
  name: string;
  phone: string;
  status: string;
  avatarUrl?: string | null;
  colors: {
    cardBg: string;
    text: string;
    subText: string;
    accent: string;
    border: string;
  };
  onPress?: () => void;
  /** Highlight the card when the Account sub-screen is active */
  isActive?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  phone,
  status,
  avatarUrl,
  colors,
  onPress,
  isActive = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.profileSection,
        { backgroundColor: colors.cardBg },
        isActive && { borderLeftWidth: 3, borderLeftColor: colors.accent },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.profileInfo}>
        <Text style={[styles.profileName, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.profileStatus, { color: colors.subText }]}>{status}</Text>
        <Text style={[styles.profilePhone, { color: colors.subText }]}>{phone}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.subText} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileStatus: {
    fontSize: 13,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 12,
  },
});

export default ProfileCard;