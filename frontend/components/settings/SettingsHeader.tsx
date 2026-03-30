// frontend/components/settings/SettingsHeader.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingsHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  colors: {
    cardBg: string;
    text: string;
    border: string;
  };
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title,
  showBackButton = true,
  onBackPress,
  colors,
}) => {
  return (
    <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
      {showBackButton ? (
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {title}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default SettingsHeader;