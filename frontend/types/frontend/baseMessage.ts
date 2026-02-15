// frontend/types/frontend/baseMessage.ts

export type FrontendCoreMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'document'
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
  // metadata?: Record<string, unknown>;
  metadata?: MediaMetadata | Record<string, any>;

  isRead: boolean;
}


export interface MediaMetadata {
  url: string;
  original_name?: string;
  mime_type?: string;

  cloudinary?: {
    public_id: string;
    resource_type: string;
    format?: string;
    bytes?: number;
    width?: number;
    height?: number;
    duration?: number;
  }
}
