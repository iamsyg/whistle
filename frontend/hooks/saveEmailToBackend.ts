// frontend/hooks/saveEmailToBackend.ts

import { supabase } from "@/utils/supabase";

export async function saveEmailToBackend(email: string, email_verified: boolean) {

    try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;

        if (!token) return;

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
                email_verified,
            }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to save email to backend');
        }
    } catch (error) {
        console.error('Error saving email to backend:', error);
    }
}
