// types/frontend/message.ts

export interface FrontendMessage {
  id: string;

  text: string;
  senderId: string;

  timestamp: Date; // UI needs Date, not string

  type: 'text' | 'image' | 'document';
  metadata?: Record<string, any>;

  isRead: boolean;
}

export interface MessageDraft {
  text: string;
  type: 'text' | 'image' | 'document';
  metadata?: Record<string, any>;
}