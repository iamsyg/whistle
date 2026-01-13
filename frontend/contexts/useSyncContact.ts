// frontend/contexts/useSyncContact.ts

// ✅ Send hashes to backend with improved error handling

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/utils/supabase';

export const syncContact = async (hashedPhoneNumbers: string[]) => {
    console.log('Sending hashes to backend:', hashedPhoneNumbers.length);

    if (hashedPhoneNumbers.length === 0) {
      console.log('No valid contacts to match, skipping backend call');
      return { success: true, data: { matched_contacts: [], count: 0 } };
    }

    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      console.error('EXPO_PUBLIC_BACKEND_URL not set!');
      Alert.alert('Configuration Error', 'Backend URL not configured.');
      return { success: false };
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        console.error('No access token found');
        Alert.alert('Authentication Error', 'Please log in again.');
        router.replace('/(auth)/login');
        return { success: false };
      }

      console.log('Fetching from:', `${backendUrl}/contacts/match-contacts`);
      const response = await fetch(`${backendUrl}/contacts/match-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ phone_hashes: hashedPhoneNumbers }),
      });

      console.log('Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend response error:', errorText);

        // ✅ Better error messaging
        if (response.status === 401) {
          Alert.alert('Session Expired', 'Please log in again.');
          router.replace('/(auth)/login');
        } else {
          Alert.alert('Sync Error', 'Failed to match contacts. Please try again.');
        }
        return { success: false };
      }

      const data = await response.json();
      console.log('Matched contacts:', data.count);
      return { success: true, data };
    } catch (error) {
      console.error('Backend request error:', error);
      Alert.alert(
        'Connection Error',
        'Cannot connect to server. Please check your internet connection.'
      );
      return { success: false };
    }
  };