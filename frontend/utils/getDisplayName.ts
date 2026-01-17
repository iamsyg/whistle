// utils/getDisplayName.ts

import { BackendMessage } from '@/types/backend/message';
import { RootState } from '@/store/store';
import { UserConversation } from '@/types/conversation';

export const getDisplayName = (
    item: UserConversation,
    contactsByProfileId: RootState['contacts']['byProfileId']
) => {
    if (item.type === 'direct' && item.other_user) {
        const savedContact = contactsByProfileId[item.other_user.id];
        return (
            savedContact?.name ||
            item.other_user.name ||
            item.other_user.username ||
            item.other_user.phone_number ||
            'Unknown'
        );
    }

    if (item.type === 'group') {
        return item.title || 'Group Chat';
    }

    return 'Classroom Chat';
};

export const getSenderDisplayName = (
    msg: BackendMessage,
    contactsByProfileId: Record<string, any>
): string => {
    const senderId = msg.sender_id;

    // 1️⃣ Saved contact
    const savedContact = contactsByProfileId[senderId];
    console.log('Saved contact:', savedContact);
    if (savedContact?.name) {
        return savedContact.name;
    }

    // 2️⃣ Backend name
    if (msg.sender?.name) {
        return msg.sender.name;
    }

    // 3️⃣ Phone number
    if (msg.sender?.phone_number) {
        return msg.sender.phone_number;
    }

    // 4️⃣ Default fallback
    return 'User';
};
