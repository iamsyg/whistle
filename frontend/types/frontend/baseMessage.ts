// types/frontend/baseMessage.ts

export type FrontendCoreMessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'system';

export interface BaseFrontendMessage<
  TMessageType extends string = string
> {
  id: string;

  text: string;
  senderId: string;

  senderName: string;

  senderGoogleName?: string | null;
  senderEmail?: string | null;

  senderAvatar?: string | null;

  timestamp: Date; // UI-friendly

  type: TMessageType;
  metadata?: Record<string, unknown>;

  isRead: boolean;
}

// export interface MessageDraft {
//   text: string;
//   type: 'text' | 'image' | 'document';
//   metadata?: Record<string, any>;
// }