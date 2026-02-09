// frontend/types/frontend/classroomMessage.ts

import { BaseFrontendMessage, FrontendCoreMessageType } from './baseMessage';

export interface ClassroomSenderFields {
  senderRole: 'admin' | 'member';
  senderPhone?: string | null;
  senderUsername?: string | null;
  senderGoogleName?: string | null;
  senderEmail?: string | null;
  googleAvatar?: string | null;
}

export type ClassroomMessageType =
  | FrontendCoreMessageType
  | 'announcement'
  | 'assignment';

export type ClassroomFrontendMessage =
  BaseFrontendMessage<ClassroomMessageType> &
  ClassroomSenderFields;