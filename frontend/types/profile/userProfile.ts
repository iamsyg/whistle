// frontend/types/profile/userProfile.ts

type UserProfile = {
    id: string;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
    phone_number: string;
    about: string | null;
    profile_links: ProfileLink[]; // Array of profile links
    primary_email: Email | null; // Primary email address
    emails: Email[]; // Array of email addresses
};

type ProfileLink = {
    url: string;
    key: string; // e.g., "linkedin", "github", "twitter"
};

type Email = {
    email: string;
    verified: boolean;
    google_name?: string | null;
};

export type { UserProfile, ProfileLink };

