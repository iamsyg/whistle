// frontend/hooks/saveEmailToBackend.ts

import { supabase } from "@/utils/supabase";

export async function saveEmailToBackend(email: string, google_name: string, email_verified: boolean) {

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
                google_name,
                email_verified,
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
    } catch (error) {
        console.error('Error saving email to backend:', error);
        throw error; // 🚨 REQUIRED
    }
}
