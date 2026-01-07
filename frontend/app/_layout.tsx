// app/_layout.tsx

import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { useEffect } from 'react';
import AuthBootstrap from '../components/AuthBootstrap';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AuthBootstrap />
        <View style={styles.container}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Always load tabs – auth is bypassed */}
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(screens)/connect-nodes" />

            {/* Keep auth screens for later use (optional) */}
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/otp" />
            <Stack.Screen name="(auth)/email" />
            <Stack.Screen name="(auth)/email-otp" />
            <Stack.Screen name="(auth)/profile-setup" />
          </Stack>
        </View>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
