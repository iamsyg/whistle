// types/backend/classroomMessage.ts
import { BaseBackendMessage, CoreMessageType } from './baseMessage';

export type ClassroomMessageType =
  | CoreMessageType 
  | 'assignment'
  | 'announcement';

export type ClassroomBackendMessage =
  BaseBackendMessage<ClassroomMessageType>;