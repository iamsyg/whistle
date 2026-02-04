// frontend/hooks/classroom/fetchClassrooms/useFetchEmailClassrooms.ts

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Alert } from "react-native";
import { router } from "expo-router";

export function useFetchEmailClassrooms(selectedEmail: string | null) {
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
      }

      if (!selectedEmail) {
      console.log('Error: getAllClassroomIds.ts: No user ID', selectedEmail);
      return;
    }

    console.log('   Selected Email:', selectedEmail);

        const url = `${process.env.EXPO_PUBLIC_BACKEND_URL}/classroom/all?selected_email=${encodeURIComponent(selectedEmail)}`;
        
        console.log('📡 GET:', url);

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err?.detail || "FETCH_FAILED");
        }

        const result = await res.json();
        console.log('   Response:', result);

        return result.classrooms;

      } catch (err: any) {
      setError(err.message || "UNKNOWN_ERROR");
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedEmail]);

  return { fetchClassrooms, loading, error };
}
