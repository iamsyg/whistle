// frontend/types/user/settings/privacy/privacySettings.ts

export interface PrivacySettings {
    phone_visibility: 'everyone'| 'selected_contacts'| 'nobody';
    last_seen_visibility: 'everyone'| 'selected_contacts'| 'nobody';
    // online_visibility: 'everyone'| 'selected_contacts'| 'nobody';
    profile_photo_visibility: 'everyone'| 'selected_contacts'| 'nobody';
    about_visibility: 'everyone'| 'selected_contacts'| 'nobody';
    status_visibility: 'everyone'| 'selected_contacts'| 'nobody';
    read_receipts_enabled: boolean;
    block_unknown_messages: boolean;
    // app_lock: boolean;
};