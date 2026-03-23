// frontend/utils/messageMapper.ts

import { BackendMessage } from '@/types/backend/message';
import { FrontendMessage } from '@/types/frontend/message';
import { getSenderDisplayName } from './getDisplayName';


// export const getMessagePreview = (msg: BackendMessage) => {
//   switch (msg.message_type) {
//     case "image":
//       return "🖼️ Photo";
//     case "video":
//       return "🎥 Video";
//     case "document":
//       return "📄 Document";
//     case "task":
//       return "✅ Task";
//     case "money_split":
//       return "💸 Split";
//     case "system":
//       return "ℹ️ System message";
//     default:
//       return msg.content;
//   }
// };



import { BaseBackendMessage } from "@/types/backend/baseMessage";

export function getMessagePreview<T extends string>(
  message: BaseBackendMessage<T>
): string {

  switch (message.message_type) {
    case 'image':
      return '🖼️ Photo';

    case 'video':
      return '🎥 Video';

    case 'document':
      return '📎 Document';

    case 'assignment':
      return '📝 Assignment';

    case 'announcement':
      return '📢 Announcement';

    case 'system':
      return message.content || "";

    default:
      return message.content || "";
  }
}



const MESSAGE_TYPE_MAP: Record<
  BackendMessage['message_type'],
  FrontendMessage['type']
> = {
  text: 'text',
  image: 'image',
  video: 'video',
  document: 'document',

  system: 'system',

  task: 'text',
  money_split: 'text',
};

export function mapBackendMessageToUI(
  msg: BackendMessage,
  currentUserProfileId: string,
  contactsByProfileId: Record<string, any>,
): FrontendMessage {
  const frontendType = MESSAGE_TYPE_MAP[msg.message_type] ?? 'text';

  // Extract media metadata from nested payload
  const rawMetadata = msg.metadata ?? {};
  const payload = rawMetadata?.payload ?? {};

  const metadata =
    msg.message_type === 'text' || msg.message_type === 'system'
      ? rawMetadata
      : {
          url: payload.url,                        // ✅ flattened
          original_name: payload.original_name,
          mime_type: payload.mime_type,
          ...payload.cloudinary,                   // width, height, etc.
        };

  return {
    id: msg.id,
    text: msg.message_type === 'text' ? msg.content : payload.original_name ?? '',
    senderId: msg.sender_id,
    senderName:
      msg.sender_id !== currentUserProfileId
        ? getSenderDisplayName(msg, contactsByProfileId)
        : 'You',
    senderAvatar: msg.sender?.avatar_url ?? null,
    timestamp: new Date(msg.created_at),
    type: frontendType,
    metadata,                                      // ✅ flat — url is at top level
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
  video: 'video',
  document: 'document',

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
    text: msg.content || '',
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