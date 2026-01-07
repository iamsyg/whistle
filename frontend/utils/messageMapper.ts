// utils/messageMapper.ts

import { BackendMessage } from '@/types/backend/message';
import { FrontendMessage } from '@/types/frontend/message';

export const mapBackendMessageToUI = (
  msg: BackendMessage,
  currentUserId: string
): FrontendMessage => ({
  id: msg.id,
  text: msg.content,
  senderId: msg.sender_id,
  timestamp: new Date(msg.created_at),
  type: msg.message_type,
  metadata: msg.metadata,
  isRead: msg.sender_id === currentUserId,
});
