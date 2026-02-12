// frontend/types/conversation.ts

// import { ClassroomMeta } from "./classroom";


export interface UserConversation {
  chat_id: string;
  type: 'chat' | 'classroom';
  sub_type: 'direct' | 'group' | 'email-classroom' | 'non-email-classroom';
  other_user?: OtherUser | null; // only for direct chats
  
  title?: string | null; // only for group/classroom chats
  created_at?: string | null;

  avatar_url?: string | null;

  last_message?: LastMessage | null;

  last_message_at?: string | null;

  creator?: Creator | null,

  require_email?: boolean |null,
  join_method?: "email" | "non-email" | null,
  is_admin?: boolean | null,

  meta?: Record<string, any>;
}


export interface OtherUser {
  id: string;
  phone_number_hash: string | null;
  phone_number?: string; // 👈 Add this. Backend MUST send this.
  name: string | null;
  username: string | null;
  avatar_url: string | null;
}


export interface LastMessage {
  content: string;
  created_at: string;
  sender_id: string;
}

export interface Creator {
  id: string;
  name: string;
  avatar_url: string | null;
  email: string | null;   // ✅ allow null
  google_name: string | null;
}
