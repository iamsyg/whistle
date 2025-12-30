// // app/(tabs)/_layout.tsx

// import { Tabs } from 'expo-router';
// import { StyleSheet } from 'react-native';

// export default function TabsLayout() {
//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarStyle: styles.tabBar,
//         tabBarActiveTintColor: '#1971c2',
//         tabBarInactiveTintColor: '#666',
//       }}
//     >
//       <Tabs.Screen name="Chats" />
//       <Tabs.Screen name="Classroom" />
//       <Tabs.Screen name="Calls" />
//       {/* Add more tabs as needed Madhu Tiwary */}
//     </Tabs>
//   );
// }

// const styles = StyleSheet.create({
//   tabBar: {
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//     backgroundColor: '#fff',
//   },
// });




// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import Header from '../../components/Header';

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
      <Tabs.Screen
        name="Chats"
        options={{
          headerShown: true,
          header: () => (
            <Header 
              title="Chats"
              searchPlaceholder="Search chats..."
              onSearch={(query) => console.log('Search chats:', query)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Classroom"
        options={{
          headerShown: true,
          header: () => (
            <Header 
              title="Classroom"
              searchPlaceholder="Search classrooms..."
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Calls"
        options={{
          headerShown: true,
          header: () => (
            <Header 
              title="Calls"
              searchPlaceholder="Search calls..."
            />
          ),
        }}
      />
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