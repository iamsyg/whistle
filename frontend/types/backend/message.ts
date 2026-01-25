// types/backend/message.ts
import { BaseBackendMessage, CoreMessageType } from './baseMessage';

export type BackendMessageType =
  | CoreMessageType
  | 'task'
  | 'money_split';

export type BackendMessage =
  BaseBackendMessage<BackendMessageType>;