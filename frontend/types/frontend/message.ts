// types/frontend/message.ts

export type FrontendMessageType =
  | 'text'
  | 'image'
  | 'document'
  | 'system';

export interface FrontendMessage {
  id: string;

  text: string;
  senderId: string;

  senderName: string;
  senderAvatar?: string | null;

  timestamp: Date; // UI needs Date, not string

  type: FrontendMessageType
  metadata?: Record<string, any>;

  isRead: boolean;
}

export interface MessageDraft {
  text: string;
  type: 'text' | 'image' | 'document';
  metadata?: Record<string, any>;
}