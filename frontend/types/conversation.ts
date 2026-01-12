// types/backend/conversation.ts


export interface UserAllConversationsResponse {
  conversation_ids: UserConversation[];
}

export interface UserConversation {
  chat_id: string;
  type: 'direct' | 'group' | 'classroom';

  other_user?: OtherUser; // only for direct chats

  last_message?: LastMessage | null;

  last_message_at: string | null;
}


export interface OtherUser {
  id: string;
  phone_number_hash: string | null;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
}


export interface LastMessage {
  content: string;
  created_at: string;
  sender_id: string;
}

