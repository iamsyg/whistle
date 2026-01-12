// types/backend/chat.ts
export interface BackendConversation {
  id: string;
  type: 'direct' | 'group' | 'classroom';

  user1?: string;
  user2?: string;

  title: string | null;
  image_url: string | null;

  created_by: string;
  last_message_at: string | null;
  created_at: string;
}
