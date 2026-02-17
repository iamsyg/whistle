// frontend/types/backend/baseMessage.ts

export interface BaseBackendMessage<TMessageType extends string = string> {
  id: string;
  chat_id: string;
  sender_id: string;

  content: string;
  message_type: TMessageType;

  metadata?: Record<string, any>;
  // metadata:  MessageMetadata;

  reply_to_id: string | null;

  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;


  sender?: {
    id: string;
    name: string | null;
    phone_number?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    google_name?: string | null;
    google_avatar?: string | null;
    email?: string | null;
    role?: 'admin' | 'member' | null;
    join_via?: 'phone' | 'username' | 'email' | null;
  } | null;

  entities?: Entities;
};

export type CoreMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'document'
  | 'system';


export type Task = {
  
  "id": string,
  "chat_id": string,
  "message_id": string,
  "title": string,

  "description": string | null,
  "created_by": string,
  "due_date": string | null,

  "status": "pending" | "in_progress" | "completed",
  "created_at": string,
  "updated_at": string,

  "creator": {
      "id": string,
      "name": string | null,
      "username": string | null,
      "avatar_url": string | null,
  }
};

export type Entities = {
  "tasks"?: Task[] | null;
  "assignees"?: Assignees[] | null;
}

export type Assignees = {

  "id": string,
  "name": string,
  "username": string | null,
  "avatar_url": string | null,
}

export type TextMetadata = {
  type: 'text';
  payload: {};
};

export type MediaMetadata = {
  type: 'media';
  payload: {
    url: string;
    original_name: string;
    mime_type: string;
    cloudinary: {
      public_id: string;
      resource_type: string;
      bytes: number;
      format?: string;
      width?: number;
      height?: number;
      duration?: number;
    };
  };
};

export type TaskMetadata = {
  type: 'task';
  payload: {
    entity: 'task';
    entity_id: string;
    action: 'created' | 'updated' | 'completed' | 'deleted';
  };
};

export type MessageMetadata =
  | TextMetadata
  | MediaMetadata
  | TaskMetadata;


