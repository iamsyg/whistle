// types/backend/baseMessage.ts
export interface BaseBackendMessage<TMessageType extends string = string> {
  id: string;
  chat_id: string;
  sender_id: string;

  sender?: {
    id: string;
    name: string | null;
    phone_number?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    google_name?: string | null;
    email?: string | null;
  };

  content: string;
  message_type: TMessageType;

  metadata?: {
    file_url?: string;
    file_name?: string;
    mime_type?: string;
    reply_preview?: string;
  };

  reply_to_id: string | null;

  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

export type CoreMessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'system';