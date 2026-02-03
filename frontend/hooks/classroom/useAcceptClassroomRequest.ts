// frontend/hooks/classroom/useAcceptClassroomRequest.ts

import { useState } from "react";
import { supabase } from "@/utils/supabase";

export function useAcceptClassroomRequest(request_id: string) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    console.log("Request ID in hook:", request_id);

    const acceptClassroomRequest = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;

            if (!token) throw new Error("AUTH_REQUIRED");

            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/classroom/join-requests/approve/?request_id=${request_id}`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result?.detail || "ACCEPT_FAILED");
            }

            const result = await response.json();

            return result;

        } catch (err: any) {
            setError(err.message || "UNKNOWN_ERROR");
            return false;

        } finally {
            setLoading(false);
        }
    };
    return { acceptClassroomRequest, loading, error };
}