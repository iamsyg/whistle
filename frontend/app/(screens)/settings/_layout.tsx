// frontend/app/(screens)/settings/_layout.tsx

import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// sub-screen components
import ProfileScreen from '@/app/(screens)/profileScreen';
import AccountSettingsComponent from '@/components/settings/account/AccountSettingsComponent';
import SettingsHeader from '@/components/settings/SettingsHeader';
import ProfileCard from '@/components/settings/ProfileCard';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import PrivacySettingsComponent from '@/components/settings/privacy/PrivacySettingsComponent';


// types 
type ScreenKey =
  | 'menu'
  | 'Profile'
  | 'Account'
  | 'Privacy'
  | 'Chat Controls'
  | 'Notifications'
  | 'Data & Storage'
  | 'Appearance'
  | 'Language'
  | 'Support';

interface SettingsLayoutProps {
  isDarkMode?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

// Placeholder for unimplemented screens
const Placeholder = ({ title, colors }: { title: string; colors: any }) => (
  <View style={ph.wrap}>
    <Ionicons name="construct-outline" size={52} color={colors.subText} />
    <Text style={[ph.title, { color: colors.text }]}>{title}</Text>
    <Text style={[ph.sub, { color: colors.subText }]}>Coming soon</Text>
  </View>
);

const ph = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  title: { fontSize: 20, fontWeight: '600' },
  sub: { fontSize: 14 },
});

// Main layout
const SettingsLayout: React.FC<SettingsLayoutProps> = ({ isDarkMode = false }) => {
  // state
  const [activeScreen, setActiveScreen] = useState<ScreenKey>('menu');

  const userProfileRedux = useSelector(
    (state: RootState) => state.profile.userProfile
  );

  // colours
  const colors = useMemo(
    () => ({
      bg: isDarkMode ? '#0D1418' : '#F5F5F5',
      cardBg: isDarkMode ? '#1F2C34' : '#FFFFFF',
      text: isDarkMode ? '#FFFFFF' : '#000000',
      subText: isDarkMode ? '#A0A0A0' : '#666666',
      border: isDarkMode ? '#2A3942' : '#E0E0E0',
      accent: isDarkMode ? '#00A884' : '#008069',
    }),
    [isDarkMode],
  );

  // animation
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const menuOpacity = useRef(new Animated.Value(1)).current;
  const [subMounted, setSubMounted] = useState(false);
  const [renderedScreen, setRenderedScreen] = useState<ScreenKey>('menu');

  const navigateTo = useCallback(
    (screen: ScreenKey) => {
      if (screen === 'menu') return;

      setRenderedScreen(screen);
      setSubMounted(true);
      slideAnim.setValue(SCREEN_WIDTH);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 68,
          friction: 11,
        }),
        Animated.timing(menuOpacity, {
          toValue: 0.35,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setActiveScreen(screen);
      });
    },
    [slideAnim, menuOpacity],
  );

  const navigateBack = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(menuOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSubMounted(false);
      setActiveScreen('menu');
      setRenderedScreen('menu');
    });
  }, [slideAnim, menuOpacity]);

  // header title & back behaviour
  const headerTitle = activeScreen === 'menu' ? 'Settings' : activeScreen;
  const handleHeaderBack =
    activeScreen === 'menu' ? () => router.back() : navigateBack;

  // handlers
  const handleProfilePress = () => navigateTo('Profile');

  const handleLogout = () => {
    console.log('logged out');
    router.replace('/login');
  };

  // sub-screen renderer
  const renderSubScreen = (screen: ScreenKey) => {
    switch (screen) {
      case 'Profile':
        return (
          <ProfileScreen
            isDarkMode={isDarkMode}
            onClose={navigateBack}
          />
        );

      case 'Account':
        return (
          <AccountSettingsComponent
            isDarkMode={isDarkMode}
            hideHeader
            onLogout={handleLogout}
            onUpdateEmail={(e) => console.log('email ->', e)}
            onUpdatePhone={(p) => console.log('phone ->', p)}
            onUpdateUsername={(u) => console.log('username ->', u)}
            onUpdateTwoStepVerification={(v) => console.log('2fa ->', v)}
            initialUserData={{
              userProfileData: userProfileRedux || undefined,
              twoStepVerification: false,
            }}
          />
        );

      case 'Privacy':
        return(
            <PrivacySettingsComponent
                isDarkMode={isDarkMode}
                userProfile={userProfileRedux || undefined}
                onUpdateSettings={(settings) => {
                    console.log('Privacy settings updated:', settings);
                    // Dispatch to Redux or make API call
                }}
                onBlockContact={(contact) => {
                    console.log('Block contact:', contact);
                }}
                onUnblockContact={(contactId) => {
                    console.log('Unblock contact:', contactId);
                }}
                onUpdateAppLock={(enabled, pin) => {
                    console.log('App lock updated:', enabled, pin);
                    // Save to secure storage
                }}
                hideHeader={true}
                />
        )
        
      case 'Chat Controls':
      case 'Notifications':
      case 'Data & Storage':
      case 'Appearance':
      case 'Language':
      case 'Support':
        return <Placeholder title={screen} colors={colors} />;

      default:
        return null;
    }
  };

  // settings menu items
  const menuItems: { icon: any; label: ScreenKey }[] = [
    { icon: 'person-outline', label: 'Account' },
    { icon: 'lock-closed-outline', label: 'Privacy' },
    { icon: 'chatbubble-ellipses-outline', label: 'Chat Controls' },
    { icon: 'notifications-outline', label: 'Notifications' },
    { icon: 'cloud-outline', label: 'Data & Storage' },
    { icon: 'color-palette-outline', label: 'Appearance' },
    { icon: 'language-outline', label: 'Language' },
    { icon: 'help-circle-outline', label: 'Support' },
  ];

  return (
    <SafeAreaView
      style={[layout.safeArea, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      {/* Pinned top section */}
      <View style={[layout.stickyTop, { backgroundColor: colors.bg }]}>
        <SettingsHeader
          title={headerTitle}
          onBackPress={handleHeaderBack}
          colors={colors}
        />

        <ProfileCard
          name={userProfileRedux?.name || ''}
          phone={userProfileRedux?.phoneNumber || ''}
          status={userProfileRedux?.about || ''}
          avatarUrl={userProfileRedux?.profilePictureUrl}
          colors={colors}
          onPress={handleProfilePress}
          isActive={activeScreen === 'Profile' || activeScreen === 'Account'}
        />

        <View style={[layout.divider, { backgroundColor: colors.border }]} />
      </View>

      {/* Dynamic content area */}
      <View style={layout.contentShell}>
        {/* Background layer - Settings menu */}
        <Animated.View
          style={[layout.layer, { opacity: menuOpacity }]}
          pointerEvents={subMounted ? 'none' : 'auto'}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={layout.menuScroll}
          >
            {menuItems.map(({ icon, label }) => (
              <View
                key={label}
                style={[
                  layout.section,
                  { backgroundColor: colors.cardBg },
                ]}
              >
                <TouchableOpacity
                  style={[layout.item, { borderBottomColor: colors.border }]}
                  onPress={() => navigateTo(label)}
                  activeOpacity={0.7}
                >
                  <View style={layout.itemLeft}>
                    <Ionicons
                      name={icon}
                      size={22}
                      color={colors.accent}
                      style={layout.itemIcon}
                    />
                    <Text style={[layout.itemTitle, { color: colors.text }]}>
                      {label}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.subText}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Foreground layer - Sub-screen panel */}
        {subMounted && (
          <Animated.View
            style={[
              layout.layer,
              layout.subPanel,
              { backgroundColor: colors.bg, transform: [{ translateX: slideAnim }] },
            ]}
          >
            {renderSubScreen(renderedScreen)}
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

// Styles
const layout = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  stickyTop: {
    zIndex: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  contentShell: {
    flex: 1,
    overflow: 'hidden',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  subPanel: {
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  menuScroll: {
    paddingTop: 12,
    paddingBottom: 40,
    gap: 8,
  },
  section: {
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  item: {
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

export default SettingsLayout;