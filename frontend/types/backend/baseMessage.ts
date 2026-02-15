// frontend/types/backend/baseMessage.ts

export interface BaseBackendMessage<TMessageType extends string = string> {
  id: string;
  chat_id: string;
  sender_id: string;

  content: string;
  message_type: TMessageType;

  metadata?: Record<string, any>;

  reply_to_id: string | null;

  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;


  sender?: {
    id: string;
    name: string | null;
    phone_number?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    google_name?: string | null;
    google_avatar?: string | null;
    email?: string | null;
    role?: 'admin' | 'member' | null;
    join_via?: 'phone' | 'username' | 'email' | null;
  } | null;
};

export type CoreMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'document'
  | 'system';