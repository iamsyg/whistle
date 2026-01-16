// types/backend/message.ts

export type BackendMessageType = 'text' | 'image' | 'document';

export interface BackendMessage {
  id: string;

  chat_id: string;
  sender_id: string;

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
