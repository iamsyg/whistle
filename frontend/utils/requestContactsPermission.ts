// frontend/utils/useContactsPermission.ts

// ✅ Request contacts permission

import { Alert } from 'react-native';
import * as Contacts from 'expo-contacts';
import { router } from 'expo-router';

export const requestContactsPermission = async (): Promise<boolean> => {

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        return true;
      } else {
        Alert.alert(
          'Permission Denied',
          'Contacts permission is required to find friends.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
            { text: 'Try Again', onPress: requestContactsPermission }
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      Alert.alert('Error', 'Failed to request contacts permission.');
      return false;
    }
  };