// frontend/types/profile/userProfile.ts

type UserProfile = {
    
    userId: string | null;
    name: string;
    userName: string;
    profilePictureUrl: string;
    phoneNumber: string;
    about: string;
    profileLink: ProfileLink[];
    primary_email: Email | null; // Primary email address
    emails: Email[]; // Array of email addresses
    profileCompleted: boolean;
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

export type { UserProfile, ProfileLink, Email };
