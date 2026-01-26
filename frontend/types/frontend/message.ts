// types/frontend/message.ts

import { BaseFrontendMessage, FrontendCoreMessageType } from './baseMessage';

export type FrontendMessageType =
  | FrontendCoreMessageType
  | 'task'
  | 'money_split';

export type FrontendMessage =
  BaseFrontendMessage<FrontendMessageType>;