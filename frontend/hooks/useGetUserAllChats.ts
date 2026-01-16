// // frontend/hooks/useGetUserAllChats.ts

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setUserAllConversations } from "@/store/slices/message/conversationSlice";
import { supabase } from "@/utils/supabase";
import { Alert } from "react-native";
import { router } from "expo-router";

interface UseGetUserAllChatsState {
  loading: boolean;
  error: string | null;
}

function useGetUserAllChats(): UseGetUserAllChatsState {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false); // ✅ Prevent duplicate calls
  
  const dispatch = useDispatch();

  const myUserId = useSelector(
    (state: RootState) => state.profile.userId
  );

  const getAccessToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    return data.session.access_token;
  };

  useEffect(() => {

    // ✅ Guard: Skip if no user ID
    if (!myUserId) {
      console.log('Error: getAllChatIds.ts: No user ID', myUserId);
      return;
    }

    // ✅ Guard: Prevent duplicate initialization
    if (initializingRef.current) {
      console.log('⏸️  Already initializing chat');
      return;
    }

    const initChat = async () => {
      initializingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const token = await getAccessToken();
        if (!token) {

          initializingRef.current = false;
          setLoading(false);
          console.error('❌ No auth token');
          setError('Authentication required');

          Alert.alert('Authentication Error', 'Please log in again.', [
            { text: 'OK', onPress: () => router.replace('/(auth)/login') }
          ]);
          
          return;
        }

        console.log('🔄 Initializing chat...');
        console.log('   My User ID:', myUserId);

        const url = `${process.env.EXPO_PUBLIC_BACKEND_URL}/conversation/all/user`;
        console.log('📡 GET:', url);

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log('📥 Response status:', res.status);
        console.log('📥 Response headers:', res);

        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ Error in fetching chats', res.status);
          console.error('❌ Error details:', errorText);

          let errorMessage = 'Error in fetching chats';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.detail || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }

          setError(errorMessage);
          Alert.alert('Chat Error', errorMessage);
          return;
        }

        const data = await res.json();
        console.log('✅ Chats fetched successfully!');
        console.log('   Response:', data);
        console.log('   Chat IDs:', data); // ✅ Backend returns "id"

        if (!Array.isArray(data.conversation_ids)) {
          throw new Error("Invalid conversations response");
        }

        dispatch(setUserAllConversations(data.conversation_ids));
        
        console.log('✅ Conversation ID stored in Redux');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ Init chat error:', errorMsg);
        console.error('❌ Stack:', err instanceof Error ? err.stack : 'No stack');
        
        setError(errorMsg);
        Alert.alert(
          'Connection Error',
          'Failed to connect to chat server. Please check your internet connection.'
        );
      } finally {
        setLoading(false);
        initializingRef.current = false;
      }
    };

    initChat();
  }, [myUserId, dispatch]); // ✅ Proper dependencies

  return { loading, error };
}

export default useGetUserAllChats;