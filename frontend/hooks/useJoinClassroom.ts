// frontend/hooks/useJoinClassroom.ts

import { useState } from 'react';
import { supabase } from "@/utils/supabase";

export type JoinClassroomResponseType = {
    status: "joined" | "pending" | "already_joined";
    chat_id: string;
    user_id: string;
    message?: string;
};

export type useJoinClassroomTypes = {
    class_code: string,
    join_via: "email" | "phone" | "username"
    selected_email?: string
};

export const useJoinClassroom = ({ class_code, join_via, selected_email }: useJoinClassroomTypes) => {
    const [loading, setLoading] = useState(false);

    const joinClassroom = async () => {
        setLoading(true);

        try {

            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;

            if (!token) return null;

            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/classroom/code/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    class_code, join_via, selected_email:
                        join_via === "email" ? selected_email : undefined
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                // return backend message cleanly
                throw new Error(result?.detail || result?.message || "JOIN_FAILED");
            }

            return result as JoinClassroomResponseType;

        } catch (error: any) {
            return { error: error.message };
        } finally {
            setLoading(false);
        }
    };

    return { joinClassroom, loading };
}