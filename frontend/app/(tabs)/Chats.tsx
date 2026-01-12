// // app/(tabs)/chats.tsx

// import React from 'react';
// import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
// import FloatingActionButton from '@/components/FloatingActionButton';

// export default function ChatsScreen() {
//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.content}>
//         <Text style={styles.title}>Chats</Text>
//         <Text style={styles.subtitle}>
//           You've successfully set up your account.
//         </Text>
//       </View>
      
//       {/* Floating button should be outside the content view to be absolute positioned */}
//       <FloatingActionButton
//         href="/(screens)/connect-nodes"
//         iconName="add"
//         backgroundColor="#1971c2"
//         size={56}
//         bottom={30}
//         right={24}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     position: 'relative', // Important for absolute positioning of child
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 24,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: '#1971c2',
//     marginBottom: 16,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
// });












// app/(tabs)/chats.tsx

import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { router } from 'expo-router';
import FloatingActionButton from '@/components/FloatingActionButton';
// import useGetAllChatIds from '@/contexts/getAllChatIds';

export default function ChatsScreen() {
  const conversationIds = useSelector(
    (state: RootState) => state.conversation.userAllConversationIds
  );

  const {loading, error} = useGetAllChatIds();

  const handleFloatingButtonPress = useCallback(() => {
        const contact = selectedContacts[0];
  
        if (!contact.profileId) {
          Alert.alert('Error', 'Cannot start chat. Contact not registered.');
          return;
        }
  
        Alert.alert(
          'Start Chat',
          `Start a chat with ${contact.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Start Chat',
              onPress: () => {
                console.log('Starting chat with:', contact.name, 'ID:', contact.profileId);
  
                // Clear selections
                dispatch(
                  setContacts(contacts.map(c => ({ ...c, isSelected: false })))
                );
  
                dispatch(setConversation({
                  contactProfileId: contact.profileId!,
                }))
  
                // Navigate with contactId
                router.push('/(screens)/chatScreen');
              }
            }
          ]
        );
      }
    }, [selectedContacts, contacts, dispatch]);

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() =>
        router.push(`/(screens)/chatScreen`)
      }
    >
      <Text style={styles.chatTitle}>Chat</Text>
      <Text style={styles.chatId} numberOfLines={1}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {conversationIds.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No chats yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a conversation to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversationIds}
          keyExtractor={(item) => item}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <FloatingActionButton
        href="/(screens)/connect-nodes"
        iconName="add"
        backgroundColor="#1971c2"
        size={56}
        bottom={30}
        right={24}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  chatItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chatId: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
