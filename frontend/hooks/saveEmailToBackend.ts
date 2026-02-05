// frontend/hooks/saveEmailToBackend.ts

import { supabase } from "@/utils/supabase";

export async function saveEmailToBackend(email: string, google_name: string, email_verified: boolean, google_avatar: string | null) {

    try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;

        if (!token) {
            throw new Error("Not authenticated");
        }

        const response = await fetch(
            `${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/insert-email`,
            {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                email,
                google_name,
                email_verified,
                google_avatar
            }),
            }
        );

        if (!response.ok) {
            const body = await response.json();

            if (response.status === 409) {
                throw new Error(body.detail); // "Email already exists"
            }

            throw new Error('Not in service');
        }

        const result = await response.json();
        console.log('Email saved to backend successfully:', result);
        return result;
        
    } catch (error) {
        console.error('Error saving email to backend:', error);
        throw error; // 🚨 REQUIRED
    }
}
