// frontend/types/classroom.ts

export interface ClassroomMeta {
  chat_id: string;

  title: string;
  description?: string | null;

  created_at: string; // ISO string
  creator: ClassroomCreator;

  invite_link?: string | null;
  class_code?: string | null;

  allowed_domains?: string[] | null;
  allow_student_chat: boolean;
  require_email: boolean;

  join_method: "email" | "non-email";

  is_admin: boolean;
}

export interface ClassroomCreator {
  id: string;
  name: string;
  avatar_url?: string | null;

  email?: string | null;
  google_name?: string | null;
}
