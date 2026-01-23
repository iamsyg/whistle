//  frontend/services/conversation/createClassroom.ts

import { supabase } from "@/utils/supabase";

export async function createClassroom(
  title: string,
  description: string | null,
  requireEmail: boolean,
  allowStudentChat: boolean,
  creatorEmail: string,
) {
    const { data } = await supabase.auth.getSession();

    if (!data.session) throw new Error('Not authenticated');

    const token = data.session.access_token;

    const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/classroom/create`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                description: description,
                require_email: requireEmail,
                allow_student_chat: allowStudentChat,
                creator_email: creatorEmail,
            }),
        }
    );

    if (!res.ok) {
        throw new Error('Failed to create classroom');
    }

    return await res.json();
}