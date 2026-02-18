// frontend/store/slices/chat/membersSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatMember } from "@/types/chat/members";

interface MembersState {
    membersByChatId: Record<string, ChatMember[]>;  // key = chat_id, value = array of members for that chat

    // Record<string, Record<string, ChatMember>> // key = chat_id, value = object where key = user_id and value = ChatMember. This allows for O(1) access to members by user_id, but is more complex to manage when adding/removing members. For now, we'll stick with the array approach for simplicity, since we don't expect large numbers of members in a chat. We can always refactor later if performance becomes an issue.

    loadedChatIds: Record<string, boolean>;
}

const initialState: MembersState = {
    membersByChatId: {},
    loadedChatIds: {},
};

const membersSlice = createSlice({
    name: "chatMembers",
    initialState,
    reducers: {

        setChatMembers: (state, action: PayloadAction<{ chatId: string; members: ChatMember[] }>) => {
            const { chatId, members } = action.payload;
            state.membersByChatId[chatId] = members;
            state.loadedChatIds[chatId] = true;
        },

        // Update existing member is pending, but for now we can just replace the whole member object when we get an update from the backend. This is simpler and ensures we always have the latest data.

        upsertChatMember: (state, action: PayloadAction<{ chatId: string; member: ChatMember }>) => {
            const { chatId, member } = action.payload;
            if (!state.membersByChatId[chatId]) {
                state.membersByChatId[chatId] = [];
            }
            const existingMemberIndex = state.membersByChatId[chatId].findIndex(m => m.user_id === member.user_id);
            if (existingMemberIndex !== -1) {
                state.membersByChatId[chatId][existingMemberIndex] = member;
            } else {
                state.membersByChatId[chatId].push(member);
            }
        },

        removeChatMember: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
            const { chatId, userId } = action.payload;
            if (state.membersByChatId[chatId]) {
                state.membersByChatId[chatId] = state.membersByChatId[chatId].filter(m => m.user_id !== userId);
            }
        },

        clearChatMembers: (state, action: PayloadAction<string>) => {
            const chatId = action.payload;
            delete state.membersByChatId[chatId];
        }

    }
});

export const { setChatMembers, upsertChatMember, removeChatMember, clearChatMembers } = membersSlice.actions;

export default membersSlice.reducer;