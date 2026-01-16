// frontend/services/conversation/createGroup.ts

import { supabase } from "@/utils/supabase";

export async function createGroupChat(
  title: string,
  memberIds: string[]
) {

  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Not authenticated');

  const token = data.session.access_token;

  const res = await fetch(
    `${process.env.EXPO_PUBLIC_BACKEND_URL}/conversation/create-group`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        member_ids: memberIds,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json(); // { success, chat_id, type }
}
