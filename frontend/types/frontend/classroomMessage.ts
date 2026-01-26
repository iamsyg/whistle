// types/frontend/classroomMessage.ts
import { BaseFrontendMessage, FrontendCoreMessageType } from './baseMessage';

export type ClassroomMessageType =
  | FrontendCoreMessageType
  | 'announcement'
  | 'assignment';

export type ClassroomFrontendMessage =
  BaseFrontendMessage<ClassroomMessageType>;