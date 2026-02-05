// frontend/types/classroom/classroomMembersCardTypes.ts

export interface classroomMembersCardTypes {
    user_id: string;
    role: "admin" | "member";
    joined_at: string; // ISO string
    email?: string | null;
    google_name?: string | null;
}