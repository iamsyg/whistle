// frontend/types/conversation.ts

import { ClassroomMeta } from "./classroom";

export interface UserAllConversationsResponse {
  conversation_ids: UserConversation[];
}

export interface UserConversation {
  chat_id: string;
  type: 'direct' | 'group' | 'classroom';

  other_user?: OtherUser; // only for direct chats
  
  title?: string | null; // only for group/classroom chats
  avatar_url?: string | null;

  last_message?: LastMessage | null;

  last_message_at: string | null;

  meta?: ClassroomMeta;

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

