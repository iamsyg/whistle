// // utils/messageMapper.ts

import { BackendMessage } from '@/types/backend/message';
import { FrontendMessage } from '@/types/frontend/message';
import { getSenderDisplayName } from './getDisplayName';

export function mapBackendMessageToUI(
  msg: BackendMessage,
  currentUserProfileId: string,
  contactsByProfileId: Record<string, any>,
): FrontendMessage {
  let frontendType: FrontendMessage['type'];

  switch (msg.message_type) {
    case 'text':
      frontendType = 'text';
      break;

    case 'image':
      frontendType = 'image';
      break;

    case 'file':
      frontendType = 'document';
      break;

    case 'task':
    case 'money_split':
    case 'system':
      frontendType = 'text'; // rendered as text/system-style
      break;

    default:
      frontendType = 'text'; // future-proof
  }

  return {
    id: msg.id,
    text: msg.content,
    senderId: msg.sender_id,
    senderName: msg.sender_id !== currentUserProfileId ? getSenderDisplayName(msg, contactsByProfileId) : 'You',
    senderAvatar: msg.sender?.avatar_url ?? null,
    timestamp: new Date(msg.created_at),
    type: frontendType,
    metadata: msg.metadata ?? {},
    isRead: msg.sender_id === currentUserProfileId,
  };
}
