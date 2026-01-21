// // frontend/hooks/useGetUserAllClassroom.ts

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
// import { setUserAllConversations } from "@/store/slices/message/conversationSlice";
import { supabase } from "@/utils/supabase";
import { Alert } from "react-native";
import { router } from "expo-router";
import { setClassroomProfile } from "@/store/slices/classroom/classroomSlice";

interface UseGetUserAllClassroomState {
  loading: boolean;
  error: string | null;
}

function useGetUserAllClassroom(): UseGetUserAllClassroomState {
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
      console.log('Error: getAllClassroomIds.ts: No user ID', myUserId);
      return;
    }

    // ✅ Guard: Prevent duplicate initialization
    if (initializingRef.current) {
      console.log('⏸️  Already initializing classroom');
      return;
    }

    const initClassroom = async () => {
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

        console.log('🔄 Initializing classroom...');
        console.log('   My User ID:', myUserId);

        const url = `${process.env.EXPO_PUBLIC_BACKEND_URL}/classroom/all`;
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
          console.error('❌ Error in fetching classrooms', res.status);
          console.error('❌ Error details:', errorText);

          let errorMessage = 'Error in fetching classrooms';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.detail || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }

          setError(errorMessage);
          Alert.alert('Classroom Error', errorMessage);
          return;
        }

        const data = await res.json();
        console.log('✅ Classrooms fetched successfully!');
        console.log('   Response:', data);
        console.log('   Classroom IDs:', data); // ✅ Backend returns "id"

        if (!Array.isArray(data.classrooms)) {
          throw new Error("Invalid classrooms response");
        }

        // dispatch(setUserAllConversations(data.conversation_ids));
        dispatch(setClassroomProfile(data.classrooms));
        
        console.log('✅ Classroom ID stored in Redux');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ Init classroom error:', errorMsg);
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

    initClassroom();
  }, [myUserId, dispatch]); // ✅ Proper dependencies

  return { loading, error };
}

export default useGetUserAllClassroom;