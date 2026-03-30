// frontend/app/(screens)/settings/settingsScreen.tsx

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import AccountSettingsComponent from '@/components/settings/account/AccountSettingsComponent';
import { RootState } from '@/store/store';
import { UserProfile } from '@/types/profile/userProfile';
// import { updateUserProfile } from '@/store/slices/profileSlice'; // Adjust import based on your actual slice

interface SettingsScreenProps {
  isDarkMode?: boolean;
}

type SettingsOption =
  | 'Profile'
  | 'Account'
  | 'Privacy'
  | 'Chat Controls'
  | 'Notifications'
  | 'Data & Storage'
  | 'Appearance'
  | 'Language'
  | 'Support'
  | null;

const SettingsScreen: React.FC<SettingsScreenProps> = ({ isDarkMode = false }) => {
  const dispatch = useDispatch();
  const [selectedOption, setSelectedOption] = useState<SettingsOption>(null);

  const userProfile = useSelector((state: RootState) => state.profile.userProfile);

  const colors = useMemo(() => ({
    bg: isDarkMode ? '#0D1418' : '#F5F5F5',
    cardBg: isDarkMode ? '#1F2C34' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#A0A0A0' : '#666666',
    border: isDarkMode ? '#2A3942' : '#E0E0E0',
    accent: isDarkMode ? '#00A884' : '#008069',
  }), [isDarkMode]);

  const handleLogout = () => {
    console.log('User logged out');
    // Add logout logic here (clear tokens, reset Redux state, etc.)
    router.replace('/login');
  };

  const handleUpdateEmail = (email: string) => {
    console.log('Email updated to:', email);
    if (userProfile) {
      const updatedProfile: UserProfile = {
        ...userProfile,
        primary_email: {
          ...userProfile.primary_email,
          email: email,
          verified: false, // New email needs verification
        },
        emails: [
          {
            email: email,
            verified: false,
          },
          ...(userProfile.emails || [])
        ]
      };
      // dispatch(updateUserProfile(updatedProfile));
    }
  };

  const handleUpdatePhone = (phone: string) => {
    console.log('Phone updated to:', phone);
    if (userProfile) {
      const updatedProfile: UserProfile = {
        ...userProfile,
        phoneNumber: phone,
      };
      // dispatch(updateUserProfile(updatedProfile));
    }
  };

  const handleUpdateUsername = (username: string) => {
    console.log('Username updated to:', username);
    if (userProfile) {
      const updatedProfile: UserProfile = {
        ...userProfile,
        userName: username,
      };
      // dispatch(updateUserProfile(updatedProfile));
    }
  };

  const handleUpdateTwoStepVerification = (enabled: boolean) => {
    console.log('2FA enabled:', enabled);
    // Handle 2FA update logic here (may be a separate API call)
  };

  const handleOptionPress = (option: SettingsOption) => {
    if (option === 'Profile') {
      router.push('/(screens)/profileScreen');
    } else {
      setSelectedOption(option);
    }
  };

  const handleBackToMenu = () => {
    setSelectedOption(null);
  };

  const handleProfilePress = () => {
    router.push('/(screens)/profileScreen');
  };

  const renderOptionContent = () => {
    switch (selectedOption) {
      case 'Account':
        return (
          <AccountSettingsComponent
            isDarkMode={isDarkMode}
            onLogout={handleLogout}
            onUpdateEmail={handleUpdateEmail}
            onUpdatePhone={handleUpdatePhone}
            onUpdateUsername={handleUpdateUsername}
            onUpdateTwoStepVerification={handleUpdateTwoStepVerification}
            initialUserData={{
              userProfileData: userProfile || undefined,
              twoStepVerification: false,
            }}
            hideHeader
          />
        );

      case 'Privacy':
        return <PlaceholderContent title="Privacy" colors={colors} />;

      case 'Chat Controls':
        return <PlaceholderContent title="Chat Controls" colors={colors} />;

      case 'Notifications':
        return <PlaceholderContent title="Notifications" colors={colors} />;

      case 'Data & Storage':
        return <PlaceholderContent title="Data & Storage" colors={colors} />;

      case 'Appearance':
        return <PlaceholderContent title="Appearance" colors={colors} />;

      case 'Language':
        return <PlaceholderContent title="Language" colors={colors} />;

      case 'Support':
        return <PlaceholderContent title="Support" colors={colors} />;

      default:
        return null;
    }
  };

  const SettingsItem = ({ icon, title, onPress }: any) => (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <Ionicons name={icon} size={22} color={colors.accent} style={styles.itemIcon} />
        <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.subText} />
    </TouchableOpacity>
  );

  const SettingsMenu = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <SettingsItem
          icon="person-outline"
          title="Account"
          onPress={() => handleOptionPress('Account')}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <SettingsItem
          icon="lock-closed-outline"
          title="Privacy"
          onPress={() => handleOptionPress('Privacy')}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <SettingsItem
          icon="chatbubble-ellipses-outline"
          title="Chat Controls"
          onPress={() => handleOptionPress('Chat Controls')}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <SettingsItem
          icon="notifications-outline"
          title="Notifications"
          onPress={() => handleOptionPress('Notifications')}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <SettingsItem
          icon="cloud-outline"
          title="Data & Storage"
          onPress={() => handleOptionPress('Data & Storage')}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <SettingsItem
          icon="color-palette-outline"
          title="Appearance"
          onPress={() => handleOptionPress('Appearance')}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <SettingsItem
          icon="language-outline"
          title="Language"
          onPress={() => handleOptionPress('Language')}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.cardBg, marginBottom: 20 }]}>
        <SettingsItem
          icon="help-circle-outline"
          title="Support"
          onPress={() => handleOptionPress('Support')}
        />
      </View>
    </ScrollView>
  );

  // Show loading state if user profile is not yet loaded
  if (!userProfile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Loading profile...</Text>
      </View>
    );
  }
};

// Placeholder for unimplemented sub-screens
const PlaceholderContent = ({
  title,
  colors,
}: {
  title: string;
  colors: any;
}) => (
  <View style={placeholderStyles.container}>
    <Ionicons name="construct-outline" size={48} color={colors.subText} />
    <Text style={[placeholderStyles.title, { color: colors.text }]}>{title}</Text>
    <Text style={[placeholderStyles.sub, { color: colors.subText }]}>
      This section is coming soon.
    </Text>
  </View>
);

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  sub: {
    fontSize: 14,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  divider: {
    height: 1,
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
    gap: 8,
  },
  section: {
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    flex: 1,
  },
});

export default SettingsScreen;