// types/backend/message.ts

export type BackendMessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'system'
  | 'task'
  | 'money_split';

export interface BackendMessage {
  id: string;

  chat_id: string;
  sender_id: string;

  sender?: {
    id: string;
    name: string | null;
    phone_number?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  };

  content: string;
  message_type: BackendMessageType;

  metadata?: {
    file_url?: string;
    file_name?: string;
    mime_type?: string;
    reply_preview?: string;
  };

  reply_to_id: string | null;

  created_at: string;   // ISO string from DB
  edited_at: string | null;
  deleted_at: string | null;
}
