// frontend/types/classroom.ts

export interface ClassroomProfile {
  chat_id: string;
  title: string;
  description: string | null;
  allowed_domains: string[] | null;
  allow_student_chat: boolean;
  require_email: boolean;
  is_admin: boolean;
}
