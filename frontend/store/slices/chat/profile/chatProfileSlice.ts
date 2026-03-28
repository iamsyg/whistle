// frontend/store/slices/chat/profile/chatProfileSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatProfile } from '@/types/chat/profile/chatProfile';

export interface ChatProfileState {
    profilesByChatId: Record<string, ChatProfile>; // Keyed by chatId
    // loadingByChatId: Record<string, boolean>; // Keyed by chatId
    isChatProfileLoaded: Record<string, boolean>; // Keyed by chatId
}

const initialState: ChatProfileState = {
    profilesByChatId: {},
    // loadingByChatId: {},
    isChatProfileLoaded: {},
};

const chatProfileSlice = createSlice({
    name: "chatProfile",
    initialState,

    reducers: {
        setChatProfile: (
            state, 
            action: PayloadAction<{ chatId: string; profile: ChatProfile }>
        ) => {
            const { chatId, profile } = action.payload;
            state.profilesByChatId[chatId] = profile;
            state.isChatProfileLoaded[chatId] = true;
        },

        // setLoading: (state, action) => {
        //     const { chatId, loading } = action.payload;
        //     state.loadingByChatId[chatId] = loading;
        // },

        clearChatProfile: (state, action: PayloadAction<string>) => {
            delete state.profilesByChatId[action.payload];
            delete state.isChatProfileLoaded[action.payload];
        }
    }
});

export const { 
    setChatProfile, 
    // setLoading, 
    clearChatProfile 
} = chatProfileSlice.actions;
export default chatProfileSlice.reducer;