// frontend/utils/messageMapper.ts

import { BackendMessage } from '@/types/backend/message';
import { FrontendMessage } from '@/types/frontend/message';
import { getSenderDisplayName } from './getDisplayName';

const MESSAGE_TYPE_MAP: Record<
  BackendMessage['message_type'],
  FrontendMessage['type']
> = {
  text: 'text',
  image: 'image',
  file: 'file',

  system: 'system',

  task: 'text',
  money_split: 'text',
};

export function mapBackendMessageToUI(
  msg: BackendMessage,
  currentUserProfileId: string,
  contactsByProfileId: Record<string, any>,
): FrontendMessage {
  const frontendType =
    MESSAGE_TYPE_MAP[msg.message_type] ?? 'text';

  return {
    id: msg.id,
    text: msg.content,
    senderId: msg.sender_id,

    senderName:
      msg.sender_id !== currentUserProfileId
        ? getSenderDisplayName(msg, contactsByProfileId)
        : 'You',

    senderAvatar: msg.sender?.avatar_url ?? null,

    timestamp: new Date(msg.created_at),

    type: frontendType,
    metadata: msg.metadata ?? {},

    isRead: msg.sender_id === currentUserProfileId,
  };
}




import { ClassroomBackendMessage } from '@/types/backend/classroomMessage';
import { ClassroomFrontendMessage } from '@/types/frontend/classroomMessage';
import { getClassroomSenderDisplayName } from './getDisplayName';

const CLASSROOM_MESSAGE_TYPE_MAP: Record<
  ClassroomBackendMessage['message_type'],
  ClassroomFrontendMessage['type']
> = {
  text: 'text',
  image: 'image',
  file: 'file',

  system: 'system',

  announcement: 'announcement',
  assignment: 'assignment',
};

export function mapClassroomBackendMessageToUI(
  msg: ClassroomBackendMessage,
  currentUserProfileId: string,
  requireEmail: boolean, // 👈 ADD THIS
): ClassroomFrontendMessage {

  const classroomFrontendType =
    CLASSROOM_MESSAGE_TYPE_MAP[msg.message_type] ?? 'text';

  return {
    id: msg.id,
    text: msg.content,
    senderId: msg.sender_id,

    senderName:
      msg.sender_id !== currentUserProfileId
        ? getClassroomSenderDisplayName(msg, requireEmail)
        : 'You',

    senderAvatar: requireEmail ? msg.sender?.google_avatar ?? null : msg.sender?.avatar_url ?? null,

    senderRole: msg.sender?.role ?? 'member', // ✅ ADD THIS

    timestamp: new Date(msg.created_at),

    type: classroomFrontendType,
    metadata: msg.metadata ?? {},

    isRead: msg.sender_id === currentUserProfileId,
  };
}