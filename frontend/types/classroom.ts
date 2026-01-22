// frontend/types/classroom.ts

export interface ClassroomProfile {
  chat_id: string;

  title: string;
  description: string | null;

  created_at: string; // ISO string
  creator: ClassroomCreator;

  allowed_domains: string[] | null;
  allow_student_chat: boolean;
  require_email: boolean;

  is_admin: boolean;
}

export interface ClassroomCreator {
  id: string;
  name: string;
  avatar_url?: string | null;
}
