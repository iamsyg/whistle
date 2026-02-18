// frontend/types/chat/members.ts

export interface ChatMember {
  user_id: string;
  role: 'admin' | 'member';
  name: string | null;
  username: string | null;
  avatar_url: string | null;
}