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
import AccountSettingsComponent from '@/components/settings/account/Account';
import SettingsHeader from '@/components/settings/SettingsHeader';
import ProfileCard from '@/components/settings/ProfileCard';

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
  const [selectedOption, setSelectedOption] = useState<SettingsOption>(null);

  // Dummy user data
  const userProfile = {
    name: 'John Doe',
    phone: '+1 234 567 8900',
    email: 'john.doe@example.com',
    avatarUrl: null,
    status: 'Available',
    username: '@johndoe',
    twoStepVerification: false,
  };

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
    router.replace('/login');
  };

  const handleUpdateEmail = (email: string) => {
    console.log('Email updated to:', email);
    userProfile.email = email;
  };

  const handleUpdatePhone = (phone: string) => {
    console.log('Phone updated to:', phone);
    userProfile.phone = phone;
  };

  const handleUpdateUsername = (username: string) => {
    console.log('Username updated to:', username);
    userProfile.username = username;
  };

  const handleUpdateTwoStepVerification = (enabled: boolean) => {
    console.log('2FA enabled:', enabled);
    userProfile.twoStepVerification = enabled;
  };

  const handleOptionPress = (option: SettingsOption) => {
    setSelectedOption(option);
  };

  const handleBackToMenu = () => {
    setSelectedOption(null);
  };

  const handleProfilePress = () => {
    setSelectedOption('Profile');
  };

  /** Renders the sub-screen content (everything BELOW the sticky top section) */
  const renderOptionContent = () => {
    switch (selectedOption) {
      case 'Profile':
        router.push('/(screens)/profileScreen');
        break;
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
              email: userProfile.email,
              phoneNumber: userProfile.phone,
              username: userProfile.username,
              twoStepVerification: userProfile.twoStepVerification,
            }}
            // Hide the internal header — we're using the shared one above
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

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ── STICKY TOP SECTION ── always visible regardless of selected option */}

      {/* Header — title changes, back button behaviour changes */}
      <SettingsHeader
        title={selectedOption ?? 'Settings'}
        onBackPress={selectedOption ? handleBackToMenu : () => router.back()}
        colors={colors}
      />

      {/* Profile card — always visible */}
      <ProfileCard
        name={userProfile.name}
        phone={userProfile.phone}
        status={userProfile.status}
        avatarUrl={userProfile.avatarUrl}
        colors={colors}
        onPress={handleProfilePress}
        // Visually highlight when Account is selected
        isActive={selectedOption === 'Account'}
      />

      {/* Thin divider between sticky section and dynamic content */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* ── DYNAMIC CONTENT AREA ── */}
      <View style={styles.contentArea}>
        {selectedOption ? renderOptionContent() : <SettingsMenu />}
      </View>
    </View>
  );
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
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