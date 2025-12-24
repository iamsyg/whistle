import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import LaunchScreen from '../components/LaunchScreen';
import { SplashScreen } from 'expo-router';

export default function Index() {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigate to login screen after 1.5 seconds
      router.replace('/(auth)/login');
    }, 1500);

    return () => {
      clearTimeout(timer);
      SplashScreen.hideAsync();
    };
  }, []);

  return (
    <View style={styles.container}>
      <LaunchScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});