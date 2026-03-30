// frontend/components/settings/account/AccountSettingsComponent.tsx

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { UserProfile } from '@/types/profile/userProfile';

interface UserData {
  userProfileData?: UserProfile;
  twoStepVerification: boolean;
}

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: () => void;
  colors: {
    border: string;
    accent: string;
    danger: string;
    text: string;
    subText: string;
  };
}

interface AccountScreenProps {
  isDarkMode?: boolean;
  onLogout?: () => void;
  onUpdateEmail?: (email: string) => void;
  onUpdatePhone?: (phone: string) => void;
  onUpdateUsername?: (username: string) => void;
  onUpdateTwoStepVerification?: (enabled: boolean) => void;
  initialUserData?: Partial<UserData>;
  /**
   * When true the component's own header bar is hidden.
   * Use this when the parent screen already renders a shared header.
   */
  hideHeader?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  value,
  onPress,
  showArrow = true,
  danger = false,
  toggle = false,
  toggleValue = false,
  onToggleChange,
  colors,
}) => (
  <TouchableOpacity
    style={[styles.settingsItem, { borderBottomColor: colors.border }]}
    onPress={toggle ? undefined : onPress}
    activeOpacity={toggle ? 1 : 0.7}
  >
    <View style={styles.itemLeft}>
      <Ionicons
        name={icon}
        size={22}
        color={danger ? colors.danger : colors.accent}
        style={styles.itemIcon}
      />
      <Text style={[styles.itemTitle, { color: danger ? colors.danger : colors.text }]}>
        {title}
      </Text>
    </View>

    <View style={styles.itemRight}>
      {value && !toggle && (
        <Text style={[styles.itemValue, { color: colors.subText }]}>{value}</Text>
      )}
      {toggle && (
        <Switch
          value={toggleValue}
          onValueChange={onToggleChange}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor="#FFFFFF"
        />
      )}
      {showArrow && !toggle && (
        <Ionicons name="chevron-forward" size={18} color={colors.subText} />
      )}
    </View>
  </TouchableOpacity>
);

const AccountSettingsComponent: React.FC<AccountScreenProps> = ({
  isDarkMode = false,
  onLogout,
  onUpdateEmail,
  onUpdatePhone,
  onUpdateUsername,
  onUpdateTwoStepVerification,
  initialUserData = {},
  hideHeader = false,
}) => {
  const colors = useMemo(
    () => ({
      bg: isDarkMode ? '#0D1418' : '#F5F5F5',
      cardBg: isDarkMode ? '#1F2C34' : '#FFFFFF',
      text: isDarkMode ? '#FFFFFF' : '#000000',
      subText: isDarkMode ? '#A0A0A0' : '#666666',
      border: isDarkMode ? '#2A3942' : '#E0E0E0',
      accent: isDarkMode ? '#00A884' : '#008069',
      danger: '#E53935',
      success: '#4CAF50',
    }),
    [isDarkMode],
  );

  // Get the primary email from emails array or fallback
  const primaryEmail = initialUserData.userProfileData?.primary_email?.email || 
                       initialUserData.userProfileData?.emails?.[0]?.email || '';
  
  const [userData, setUserData] = useState({
    twoStepVerification: initialUserData.twoStepVerification ?? false,
    email: primaryEmail,
    phoneNumber: initialUserData.userProfileData?.phoneNumber || '',
    username: initialUserData.userProfileData?.userName || '',
  });

  const handleTwoStepVerification = () => {
    Alert.alert('Two-Step Verification', 'Enable or disable two-step verification', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: userData.twoStepVerification ? 'Disable' : 'Enable',
        onPress: () => {
          const newValue = !userData.twoStepVerification;
          setUserData({ ...userData, twoStepVerification: newValue });
          onUpdateTwoStepVerification?.(newValue);
        },
      },
    ]);
  };

  const handleEmail = () => {
    Alert.alert('Change Email', 'Enter new email address', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Change',
        onPress: () => {
          // In a real app, you'd get the new email from a text input
          Alert.alert('Success', 'Email updated successfully');
          onUpdateEmail?.(userData.email);
        },
      },
    ]);
  };

  const handlePhoneNumber = () => {
    Alert.alert('Change Phone Number', 'Enter new phone number', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Update',
        onPress: () => {
          Alert.alert('Success', 'Phone number updated successfully');
          onUpdatePhone?.(userData.phoneNumber);
        },
      },
    ]);
  };

  const handleUsername = () => {
    Alert.alert('Change Username', 'Enter new username', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save',
        onPress: () => {
          Alert.alert('Success', 'Username updated successfully');
          onUpdateUsername?.(userData.username);
        },
      },
    ]);
  };

  const handleLogOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          if (onLogout) {
            onLogout();
          } else {
            Alert.alert('Logged Out', 'You have been logged out successfully');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Internal header — only shown when this component is used standalone */}
      {!hideHeader && (
        <View
          style={[
            styles.header,
            { backgroundColor: colors.cardBg, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Account</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
          <SettingsItem
            icon="shield-checkmark-outline"
            title="Two-Step Verification"
            toggle
            toggleValue={userData.twoStepVerification}
            onToggleChange={handleTwoStepVerification}
            colors={colors}
          />

          <SettingsItem
            icon="mail-outline"
            title="Email Address"
            value={userData.email}
            onPress={handleEmail}
            colors={colors}
          />

          <SettingsItem
            icon="call-outline"
            title="Phone Number"
            value={userData.phoneNumber}
            onPress={handlePhoneNumber}
            colors={colors}
          />

          <SettingsItem
            icon="at-outline"
            title="Username"
            value={userData.username}
            onPress={handleUsername}
            colors={colors}
          />

          <SettingsItem
            icon="log-out-outline"
            title="Log Out"
            danger
            showArrow={false}
            onPress={handleLogOut}
            colors={colors}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: colors.subText }]}>
            Your account information helps keep your identity secure
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginHorizontal: 12,
    marginTop: 16,
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
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemValue: {
    fontSize: 14,
    marginRight: 8,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default AccountSettingsComponent;