// frontend/hooks/getUserGoogleId.ts

import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "@/utils/supabase";
import { Alert } from "react-native";
import { router } from "expo-router";
import { setEmails, setEmailVerified } from "@/store/slices/auth/emailAuthSlice";

interface UseGetUserGoogleEmailsResult {
  emails: string[];
  loading: boolean;
  error: string | null;
}

export function useGetUserGoogleEmails(): UseGetUserGoogleEmailsResult {
  const dispatch = useDispatch();
  const [localEmails, setLocalEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const fetchEmails = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          Alert.alert(
            "Authentication Error",
            "Please log in again.",
            [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
          );
          return;
        }

        const token = data.session.access_token;

        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/user/emails`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.detail || "Failed to fetch emails");
        }

        const result = await res.json();

        // Backend returns: { emails: string[] }
        setLocalEmails(result.emails);

        // If you want to store primary email in Redux
        dispatch(setEmails(result.emails));
        dispatch(setEmailVerified(true));

      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        Alert.alert("Error", msg);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [dispatch]);

  return { emails: localEmails, loading, error };
}
