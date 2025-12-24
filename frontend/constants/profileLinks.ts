export interface SocialLinkOption {
  id: string;
  icon: string;
  placeholder: string;
  prefix: string;
  iconType: 'ionicons' | 'material' | 'fontawesome';
  label: string;
}

export const SOCIAL_LINK_OPTIONS: SocialLinkOption[] = [
  { 
    id: 'website', 
    icon: 'globe', 
    placeholder: 'Website / Portfolio URL', 
    prefix: 'https://', 
    iconType: 'ionicons',
    label: 'Website'
  },
  { 
    id: 'linkedin', 
    icon: 'logo-linkedin', 
    placeholder: 'linkedin.com/in/username', 
    prefix: 'https://linkedin.com/in/', 
    iconType: 'ionicons',
    label: 'LinkedIn'
  },
  { 
    id: 'github', 
    icon: 'logo-github', 
    placeholder: 'github.com/username', 
    prefix: 'https://github.com/', 
    iconType: 'ionicons',
    label: 'GitHub'
  },
  { 
    id: 'twitter', 
    icon: 'logo-twitter', 
    placeholder: 'twitter.com/username', 
    prefix: 'https://twitter.com/', 
    iconType: 'ionicons',
    label: 'Twitter'
  },
  { 
    id: 'instagram', 
    icon: 'logo-instagram', 
    placeholder: 'instagram.com/username', 
    prefix: 'https://instagram.com/', 
    iconType: 'ionicons',
    label: 'Instagram'
  },
];

export interface ProfileLink {
  id: string;
  type: string;
  value: string;
  placeholder?: string;
}

// Initial profile links
export const INITIAL_PROFILE_LINKS: ProfileLink[] = [
  { 
    id: 'link-1', 
    type: 'website', 
    value: '', 
    placeholder: 'URL' 
  },
];

export const MAX_PROFILE_LINKS = 3;