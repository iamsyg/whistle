// frontend/hooks/useFetchJoinRequests.ts

import { useState } from "react";
import { supabase } from "@/utils/supabase";

export type JoinRequest = {
  id: string;
  user_id: string;
  join_via: "username" | "phone";
  requested_at: string;
  status: "pending";
  name: string | null;
  avatar_url: string | null;
  display_identity: string | null;
};

export type response = {
  chat_id: string;
  count: number;
  requests: JoinRequest[];
};

export function useFetchJoinRequests(chat_id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async (): Promise<response | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      if (!token) throw new Error("AUTH_REQUIRED");

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/classroom/join-requests/pending?chat_id=${chat_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.detail || "FETCH_FAILED");
      }

      return result as response;

    } catch (err: any) {
      setError(err.message || "UNKNOWN_ERROR");
      return null;

    } finally {
      setLoading(false);
    }
  };

  return { fetchRequests, loading, error };
}
