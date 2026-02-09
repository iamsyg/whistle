// frontend/types/frontend/baseMessage.ts

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
  senderAvatar?: string | null;

  timestamp: Date; // UI-friendly

  type: TMessageType;
  metadata?: Record<string, unknown>;

  isRead: boolean;
}