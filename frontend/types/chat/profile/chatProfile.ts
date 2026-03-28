// frontend/types/chat/profile/chatProfile.ts

import { ProfileLink } from "@/types/profile/userProfile";
import { ChatMember } from "../members";


export type ChatProfile = {
    id: string;
    name: string;
    username: string | null;
    avatar_url: string | null;
    phone_number: string | null;
    about: string | null;
    profile_links: ProfileLink[];

    // Only for group
    members?: ChatMember[];
};