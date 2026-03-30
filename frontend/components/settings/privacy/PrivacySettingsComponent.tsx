// frontend\components\settings\privacy\PrivacySettingsComponent.tsx

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

// Types for privacy settings
interface PrivacySettings {
  lastSeen: 'everyone' | 'myContacts' | 'nobody';
  online: 'everyone' | 'myContacts' | 'nobody';
  profilePhoto: 'everyone' | 'myContacts' | 'nobody';
  about: 'everyone' | 'myContacts' | 'nobody';
  status: 'everyone' | 'myContacts' | 'nobody';
  readReceipts: boolean;
  blockUnknownMessages: boolean;
  phoneNumberVisibility: 'everyone' | 'myContacts' | 'nobody';
  appLock: boolean;
}

interface BlockedContact {
  id: string;
  name: string;
  phoneNumber: string;
  avatarUrl?: string;
}

interface PrivacySettingsComponentProps {
  isDarkMode?: boolean;
  userProfile?: UserProfile;
  initialSettings?: Partial<PrivacySettings>;
  onUpdateSettings?: (settings: Partial<PrivacySettings>) => void;
  onBlockContact?: (contact: BlockedContact) => void;
  onUnblockContact?: (contactId: string) => void;
  onUpdateAppLock?: (enabled: boolean, pin?: string) => void;
  hideHeader?: boolean;
  colors?: {
    bg: string;
    cardBg: string;
    text: string;
    subText: string;
    border: string;
    accent: string;
    danger: string;
  };
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
  colors: any;
}

interface RadioOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}

const RadioOption: React.FC<RadioOptionProps> = ({ label, selected, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.radioOption, { borderBottomColor: colors.border }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.radioLabel, { color: colors.text }]}>{label}</Text>
    <View style={[styles.radioCircle, selected && { borderColor: colors.accent }]}>
      {selected && <View style={[styles.radioSelected, { backgroundColor: colors.accent }]} />}
    </View>
  </TouchableOpacity>
);

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

const PrivacySettingsComponent: React.FC<PrivacySettingsComponentProps> = ({
  isDarkMode = false,
  userProfile,
  initialSettings = {},
  onUpdateSettings,
  onBlockContact,
  onUnblockContact,
  onUpdateAppLock,
  hideHeader = false,
  colors: customColors,
}) => {
  // Default colors
  const defaultColors = useMemo(
    () => ({
      bg: isDarkMode ? '#0D1418' : '#F5F5F5',
      cardBg: isDarkMode ? '#1F2C34' : '#FFFFFF',
      text: isDarkMode ? '#FFFFFF' : '#000000',
      subText: isDarkMode ? '#A0A0A0' : '#666666',
      border: isDarkMode ? '#2A3942' : '#E0E0E0',
      accent: isDarkMode ? '#00A884' : '#008069',
      danger: '#E53935',
    }),
    [isDarkMode],
  );

  const colors = customColors || defaultColors;

  // State for privacy settings
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    lastSeen: initialSettings.lastSeen || 'everyone',
    online: initialSettings.online || 'everyone',
    profilePhoto: initialSettings.profilePhoto || 'everyone',
    about: initialSettings.about || 'everyone',
    status: initialSettings.status || 'everyone',
    readReceipts: initialSettings.readReceipts ?? true,
    blockUnknownMessages: initialSettings.blockUnknownMessages ?? false,
    phoneNumberVisibility: initialSettings.phoneNumberVisibility || 'everyone',
    appLock: initialSettings.appLock ?? false,
  });

  // Mock blocked contacts - in real app, this would come from Redux/API
  const [blockedContacts, setBlockedContacts] = useState<BlockedContact[]>([
    {
      id: '1',
      name: 'Spam Caller',
      phoneNumber: '+1 234 567 8901',
    },
    {
      id: '2',
      name: 'Telemarketer',
      phoneNumber: '+1 234 567 8902',
    },
  ]);

  const [showAppLockModal, setShowAppLockModal] = useState(false);

  const updateSetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    const updated = { ...privacySettings, [key]: value };
    setPrivacySettings(updated);
    onUpdateSettings?.({ [key]: value });
  };

  // Selection modal handlers
  const handleSelection = (
    setting: keyof PrivacySettings,
    options: string[]
  ) => {
    Alert.alert(
      `Who can see my ${setting}`,
      '',
      options.map((option) => ({
        text: option.charAt(0).toUpperCase() + option.slice(1),
        onPress: () => updateSetting(setting, option as any),
      })),
      { cancelable: true }
    );
  };

  const handleLastSeen = () => {
    handleSelection('lastSeen', ['everyone', 'myContacts', 'nobody']);
  };

  const handleOnline = () => {
    handleSelection('online', ['everyone', 'myContacts', 'nobody']);
  };

  const handleProfilePhoto = () => {
    handleSelection('profilePhoto', ['everyone', 'myContacts', 'nobody']);
  };

  const handleAbout = () => {
    handleSelection('about', ['everyone', 'myContacts', 'nobody']);
  };

  const handleStatus = () => {
    handleSelection('status', ['everyone', 'myContacts', 'nobody']);
  };

  const handlePhoneNumberVisibility = () => {
    handleSelection('phoneNumberVisibility', ['everyone', 'myContacts', 'nobody']);
  };

  const handleReadReceipts = () => {
    Alert.alert(
      'Read Receipts',
      'If turned off, you won\'t send or receive read receipts. Read receipts are always sent for group chats.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: privacySettings.readReceipts ? 'Disable' : 'Enable',
          onPress: () => updateSetting('readReceipts', !privacySettings.readReceipts),
        },
      ]
    );
  };

  const handleBlockUnknownMessages = () => {
    Alert.alert(
      'Block Unknown Messages',
      'Messages from unknown numbers will be blocked and won\'t appear in your chat list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: privacySettings.blockUnknownMessages ? 'Disable' : 'Enable',
          onPress: () => updateSetting('blockUnknownMessages', !privacySettings.blockUnknownMessages),
        },
      ]
    );
  };

  const handleBlockedContacts = () => {
    Alert.alert(
      'Blocked Contacts',
      'Manage your blocked contacts list',
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Add New', onPress: () => console.log('Add new blocked contact') },
      ]
    );
  };

  const handleAppLock = () => {
    Alert.alert(
      'App Lock',
      'Require authentication to open the app',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: privacySettings.appLock ? 'Disable' : 'Enable',
          onPress: () => {
            if (!privacySettings.appLock) {
              // Show PIN setup
              Alert.alert(
                'Set App Lock PIN',
                'Enter a 4-digit PIN to lock the app',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Set PIN',
                    onPress: () => {
                      updateSetting('appLock', true);
                      onUpdateAppLock?.(true, '1234'); // In real app, get actual PIN
                    },
                  },
                ]
              );
            } else {
              updateSetting('appLock', false);
              onUpdateAppLock?.(false);
            }
          },
        },
      ]
    );
  };

  const getVisibilityText = (value: string) => {
    switch (value) {
      case 'everyone':
        return 'Everyone';
      case 'myContacts':
        return 'My Contacts';
      case 'nobody':
        return 'Nobody';
      default:
        return value;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Who can see my info section */}
        <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.sectionHeader, { color: colors.subText }]}>
            Who can see my info
          </Text>
          
          <SettingsItem
            icon="time-outline"
            title="Last Seen & Online"
            value={getVisibilityText(privacySettings.lastSeen)}
            onPress={handleLastSeen}
            colors={colors}
          />

          <SettingsItem
            icon="camera-outline"
            title="Profile Photo"
            value={getVisibilityText(privacySettings.profilePhoto)}
            onPress={handleProfilePhoto}
            colors={colors}
          />

          <SettingsItem
            icon="information-circle-outline"
            title="About"
            value={getVisibilityText(privacySettings.about)}
            onPress={handleAbout}
            colors={colors}
          />

          <SettingsItem
            icon="chatbubble-outline"
            title="Status"
            value={getVisibilityText(privacySettings.status)}
            onPress={handleStatus}
            colors={colors}
          />
        </View>

        {/* Message settings section */}
        <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.sectionHeader, { color: colors.subText }]}>
            Messages
          </Text>
          
          <SettingsItem
            icon="checkmark-done-outline"
            title="Read Receipts"
            toggle
            toggleValue={privacySettings.readReceipts}
            onToggleChange={handleReadReceipts}
            colors={colors}
          />

          <SettingsItem
            icon="ban-outline"
            title="Block Unknown Messages"
            toggle
            toggleValue={privacySettings.blockUnknownMessages}
            onToggleChange={handleBlockUnknownMessages}
            colors={colors}
          />

          <SettingsItem
            icon="person-remove-outline"
            title="Blocked Contacts"
            value={`${blockedContacts.length} blocked`}
            onPress={handleBlockedContacts}
            colors={colors}
          />
        </View>

        {/* Privacy & Security section */}
        <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.sectionHeader, { color: colors.subText }]}>
            Privacy & Security
          </Text>
          
          <SettingsItem
            icon="phone-portrait-outline"
            title="Phone Number Visibility"
            value={getVisibilityText(privacySettings.phoneNumberVisibility)}
            onPress={handlePhoneNumberVisibility}
            colors={colors}
          />

          <SettingsItem
            icon="lock-closed-outline"
            title="App Lock"
            toggle
            toggleValue={privacySettings.appLock}
            onToggleChange={handleAppLock}
            colors={colors}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: colors.subText }]}>
            Your privacy settings control who can see your information and how you interact with others.
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
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    textTransform: 'uppercase',
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
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  radioLabel: {
    fontSize: 15,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
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

export default PrivacySettingsComponent;