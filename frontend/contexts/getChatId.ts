// // frontend/contexts/getChatId.ts

// import React, { useEffect, useState } from "react";
// // import useConversation from "../statemanage/useConversation.js";
// import { useDispatch, useSelector } from 'react-redux';
// import { RootState } from '@/store/store';
// import { setConversation, setMessages } from "@/store/slices/message/conversationSlice";
// import { supabase } from "@/utils/supabase";
// import { BackendMessage } from "@/types/backend/message";


// function useGetChatId() {

//     const dispatch = useDispatch();

//     const contactProfileId = useSelector(
//         (state: RootState) => state.conversation.contactProfileId
//     )

//     const conversationId = useSelector(
//         (state: RootState) => state.conversation.selectedConversationId
//     );

//     const getAccessToken = async () => {
//         const { data, error } = await supabase.auth.getSession();
//         if (error || !data.session) return null;
//         return data.session.access_token;
//     };

//     useEffect(() => {

//         if (!contactProfileId || !conversationId) return;

//         const initChat = async () => {

//             try {
//                 const token = await getAccessToken();
//                 if (!token) return;

//                 const res = await fetch(
//                     `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/direct/init/${contactProfileId}`,
//                     {
//                         method: 'POST',
//                         headers: {
//                             Authorization: `Bearer ${token}`,
//                         },
//                     }
//                 );

//                 const data = await res.json();
//                 // setChatId(data.chat_id);
//                 // dispatch(setSelectedConversationId(data.chat_id));

//                 dispatch(setConversation({
//                     contactProfileId: contactProfileId,
//                     conversationId: data.chat_id
//                 }))

//                 console.log('Chat initialized:', data.chat_id);
//             }
//             catch (error) {
//                 console.error("Error initializing chat:", error);
//             }

//         };

//         initChat();
//     }, [contactProfileId, conversationId]);

// }

// export default useGetChatId;






import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setConversation, setSelectedConversationId } from "@/store/slices/message/conversationSlice";
import { supabase } from "@/utils/supabase";
import { Alert } from "react-native";
import { router } from "expo-router";

interface UseGetChatIdState {
  loading: boolean;
  error: string | null;
}

function useGetChatId(): UseGetChatIdState {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false); // ✅ Prevent duplicate calls
  
  const dispatch = useDispatch();

  const contactProfileId = useSelector(
    (state: RootState) => state.conversation.contactProfileId
  );

  const conversationId = useSelector(
    (state: RootState) => state.conversation.selectedConversationId
  );

  const myUserId = useSelector(
    (state: RootState) => state.profile.userId
  );

  const getAccessToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    return data.session.access_token;
  };

  useEffect(() => {
    // ✅ Guard: Skip if no contact selected
    if (!contactProfileId) {
      console.log('⏸️  No contact profile ID, skipping chat init');
      return;
    }

    // ✅ Guard: Skip if no user ID
    if (!myUserId) {
      console.log('⏸️  No user ID, skipping chat init');
      return;
    }

    // ✅ Guard: Skip if already have a conversation ID
    if (conversationId) {
      console.log('⏸️  Chat already initialized:', conversationId);
      return;
    }

    // ✅ Guard: Prevent duplicate initialization
    if (initializingRef.current) {
      console.log('⏸️  Already initializing chat');
      return;
    }

    // ✅ Guard: Prevent chatting with yourself
    // if (contactProfileId === myUserId) {
    //   console.warn('❌ Cannot chat with yourself');
    //   Alert.alert('Error', 'You cannot start a chat with yourself', [
    //     { text: 'OK', onPress: () => router.back() }
    //   ]);
    //   return;
    // }

    const initChat = async () => {
      initializingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const token = await getAccessToken();
        if (!token) {
          console.error('❌ No auth token');
          setError('Authentication required');
          Alert.alert('Authentication Error', 'Please log in again.', [
            { text: 'OK', onPress: () => router.replace('/(auth)/login') }
          ]);
          return;
        }

        console.log('🔄 Initializing chat...');
        console.log('   Contact Profile ID:', contactProfileId);
        console.log('   My User ID:', myUserId);

        const url = `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/direct/init/${contactProfileId}`;
        console.log('📡 POST:', url);

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('📥 Response status:', res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ Chat init failed:', res.status);
          console.error('❌ Error details:', errorText);

          let errorMessage = 'Failed to initialize chat';
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
        console.log('✅ Chat initialized successfully!');
        console.log('   Response:', data);
        console.log('   Chat ID:', data.chat_id); // ✅ Backend returns "id"

        // ✅ Store the conversation ID in Redux
        dispatch(setSelectedConversationId(data.chat_id));
        dispatch(setConversation({
            contactProfileId: contactProfileId,
            conversationId: data.chat_id
        }))
        
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
  }, [contactProfileId, myUserId, conversationId, dispatch]); // ✅ Proper dependencies

  return { loading, error };
}

export default useGetChatId;