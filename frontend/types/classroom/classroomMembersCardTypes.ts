// frontend/types/classroom/classroomMembersCardTypes.ts

export interface classroomMembersCardTypes {
    user_id: string;
    role: "admin" | "member";

    name?: string;
    avatar_url?: string | null;
    phone?: string | null;
    username?: string | null;

    joined_at: string; // ISO string
    
    email?: string | null;
    google_name?: string | null;
    google_avatar?: string | null;
}