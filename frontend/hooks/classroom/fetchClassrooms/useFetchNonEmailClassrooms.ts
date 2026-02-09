// frontend/hooks/classroom/fetchClassrooms/useFetchNonEmailClassrooms.ts

import { useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Alert } from "react-native";
import { router } from "expo-router";

export function useFetchNonEmailClassrooms(conversationType: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClassrooms = useCallback(async () => {
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
        // `${process.env.EXPO_PUBLIC_BACKEND_URL}/conversation/all?conversation_type=${encodeURIComponent(conversationType)}`,
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/classroom/all/non-email`,
        {
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
      console.log('Non-email classroom Response:', result);
      return result;

    } catch (err: any) {
      setError(err.message || "UNKNOWN_ERROR");
      return [];

    } finally {
      setLoading(false);
    }
  }, [conversationType]);

  return { fetchClassrooms, loading, error };
}
