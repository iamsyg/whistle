import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#1971c2',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen name="home" />
      {/* Add more tabs as needed */}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
});