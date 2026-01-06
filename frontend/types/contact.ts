export interface Contact {
  contactId: string;       // local unique id
  profileId?: string;      // backend UUID
  name: string;
  phone: string;
  hash: string;
  isRegistered: boolean;
  isSelected: boolean;
  avatarColor: string;
}

export interface MatchedContact {
  id: string;                // UUID
  phone_number_hash: string;
  name?: string;
  username?: string;
  avatar_url?: string;
}
