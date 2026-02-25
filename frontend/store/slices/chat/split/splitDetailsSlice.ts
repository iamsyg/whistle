// frontend/store/slices/chat/split/splitDetailsSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SplitDetails } from "@/types/chat/split/splitDetails";

interface SplitDetailsState {
    splitDetailsById: Record<string, SplitDetails>; // key = split_id, value = SplitDetails object
    splitIdsByChatId: Record<string, string[]>;  // key = chat_id, value = array of split_ids for that chat
    loadedSplitIds: Record<string, boolean>; // key = split_id, value = whether the split details have been loaded for that split
}

const initialState: SplitDetailsState = {
    splitDetailsById: {},
    splitIdsByChatId: {},
    loadedSplitIds: {},
};

const splitDetailsSlice = createSlice({
    name: "splitDetails",
    initialState,
    reducers: {

        setSplitDetails: (state, action: PayloadAction<SplitDetails>) => {
            const splitDetails = action.payload;
            state.splitDetailsById[splitDetails.id] = splitDetails;
            state.loadedSplitIds[splitDetails.id] = true;

            if (!state.splitIdsByChatId[splitDetails.chat_id]) {
                state.splitIdsByChatId[splitDetails.chat_id] = [];
            }

            if (!state.splitIdsByChatId[splitDetails.chat_id].includes(splitDetails.id)) {
                state.splitIdsByChatId[splitDetails.chat_id].push(splitDetails.id);
            }
        },

        patchSplitDetails: (
            state, 
            action: PayloadAction<{ splitId: string; updates: Partial<SplitDetails> }>) => {
            const { splitId, updates } = action.payload;

            if (state.splitDetailsById[splitId]) {

                state.splitDetailsById[splitId] = { 
                    ...state.splitDetailsById[splitId], 
                    ...updates 
                };
            }
        },

        upsertSplitDetails: (state, action: PayloadAction<SplitDetails>) => {
            const splitDetails = action.payload;
            state.splitDetailsById[splitDetails.id] = splitDetails;

            if (!state.splitIdsByChatId[splitDetails.chat_id]) {
                state.splitIdsByChatId[splitDetails.chat_id] = [];
            }

            if (!state.splitIdsByChatId[splitDetails.chat_id].includes(splitDetails.id)) {
                state.splitIdsByChatId[splitDetails.chat_id].push(splitDetails.id);
            }

            state.loadedSplitIds[splitDetails.id] = true;

        },

        removeSplitDetails: (state, action: PayloadAction<{ splitId: string; chatId: string }>) => {
            const { splitId, chatId } = action.payload;

            delete state.splitDetailsById[splitId];
            delete state.loadedSplitIds[splitId];

            if (state.splitIdsByChatId[chatId]) {
                state.splitIdsByChatId[chatId] = state.splitIdsByChatId[chatId].filter(id => id !== splitId);
            }
        },

        clearSplitDetailsForChat: (state, action: PayloadAction<string>) => {
            const chatId = action.payload;
            const splitIds = state.splitIdsByChatId[chatId] || [];

            splitIds.forEach(splitId => {
                delete state.splitDetailsById[splitId];
                delete state.loadedSplitIds[splitId];
            });

            delete state.splitIdsByChatId[chatId];
        }

    }
});

export const { setSplitDetails, patchSplitDetails, upsertSplitDetails, removeSplitDetails,  clearSplitDetailsForChat } = splitDetailsSlice.actions;

export default splitDetailsSlice.reducer;
