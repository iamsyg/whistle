// frontend/hooks/classroom/fetchMembers/useFetchEmailClassroomMembers.ts

import { useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Alert } from "react-native";
import { router } from "expo-router";

export function useFetchEmailClassroomMembers(classroom_chat_id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClassroomMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {

        setLoading(false);
        Alert.alert('Authentication Error', 'Please log in again.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);

        return [];
      }

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/classroom/members/email?classroom_chat_id=${classroom_chat_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.detail || "FETCH_FAILED");
      }

      const result = await res.json();
      console.log('Email classroom Members Response:', result);
      return result.members;

    } catch (err: any) {
      setError(err.message || "UNKNOWN_ERROR");
      return [];

    } finally {
      setLoading(false);
    }
  }, [classroom_chat_id]);

  return { fetchClassroomMembers, loading, error };
}
