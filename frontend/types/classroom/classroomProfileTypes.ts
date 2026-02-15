// frontend/types/classroom/classroomProfileTypes.ts

export interface ClassroomProfileType {
  chat_id: string;

  title: string;
  description?: string | null;

  created_at: string; // ISO string
  is_admin: boolean;

  members: Record<string, Members>;

  pagination: Pagination;
  meta?: Record<string, any> | null;

  admin_fields?: Admin;
}

export interface Members {
    user_id: string;
    role: 'admin' | 'member';
    joined_at: string;
    email?: string | null;
    google_name?: string | null;
    google_avatar?: string | null;
    name?: string | null;
    avatar_url?: string | null;
    phone_number?: string | null;
    username?: string | null;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
}

export interface Admin {
    invite_link?: string | null;
    class_code?: string | null;
    allowed_domains?: string[] | null;
    allow_student_chat?: boolean | null;
    require_email?: boolean | null;
    join_method?: "email" | "non-email";
}
