import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { useEffect } from 'react';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // You might want to add a useEffect to hide splash screen when ready
  useEffect(() => {
    // Hide splash screen when your app is ready
    // You can add your asset loading logic here
    SplashScreen.hideAsync();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <View style={styles.container}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/otp" />
            <Stack.Screen name="(auth)/profile-setup" />
            <Stack.Screen name="(auth)/profile-details" />
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