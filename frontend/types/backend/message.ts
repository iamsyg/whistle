// types/backend/message.ts

export type BackendMessageType = 'text' | 'image' | 'document';

export interface BackendMessage {
  id: string;

  chat_id: string;
  sender_id: string;

  content: string;
  message_type: BackendMessageType;

  metadata: Record<string, any>;

  reply_to_id: string | null;

  created_at: string;   // ISO string from DB
  edited_at: string | null;
  deleted_at: string | null;
}
