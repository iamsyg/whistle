import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import AppLogo from './AppLogo';

interface LaunchScreenProps {
  appName?: string;
  showLogo?: boolean;
  showLoadingIndicator?: boolean;
}

const LaunchScreen: React.FC<LaunchScreenProps> = ({
  appName = 'MyApp',
  showLogo = true,
  showLoadingIndicator = true,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      {showLogo && <AppLogo />}
      <Text style={[styles.appName, isDark && styles.darkAppName]}>
        {appName}
      </Text>
      {showLoadingIndicator && (
        <ActivityIndicator
          size="large"
          color={isDark ? '#4dabf7' : '#1971c2'}
          style={styles.loader}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1971c2',
    marginTop: 20,
    letterSpacing: 1,
  },
  darkAppName: {
    color: '#4dabf7',
  },
  loader: {
    marginTop: 30,
  },
});

export default LaunchScreen;