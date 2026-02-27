// frontend/store/slices/chat/split/splitListSlice.ts

import { SplitListItem } from "@/types/chat/split/splitListItem";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SplitListState {
    splitListsByChatId: Record<string, SplitListItem[]>;  // key = chat_id
    isSplitListLoaded: Record<string, boolean>; // key = chat_id, value = whether the split list for that chat has been loaded
}

const initialState: SplitListState = {
    splitListsByChatId: {},
    isSplitListLoaded: {},
};

const splitListSlice = createSlice({
    name: "splitList",
    initialState,

    reducers: {
        setSplitList: (state, action: PayloadAction<{ chatId: string; splits: SplitListItem[] }>) => {
            const { chatId, splits } = action.payload;
            state.splitListsByChatId[chatId] = splits;
            state.isSplitListLoaded[chatId] = true;
        },

        addSplitToList: (state, action: PayloadAction<{ chatId: string; split: SplitListItem }>) => {
            const { chatId, split } = action.payload;
            if (!state.splitListsByChatId[chatId]) {
                state.splitListsByChatId[chatId] = [];
            }

            state.splitListsByChatId[chatId].unshift(split);
        },

        // updateSplitInList: (state, action: PayloadAction<{ chatId: string; split: SplitListItem }>) => {
        //     const { chatId, split } = action.payload;
        //     if (state.splitListsByChatId[chatId]) {
        //         const index = state.splitListsByChatId[chatId].findIndex(s => s.id === split.id);
        //         if (index !== -1) {
        //             state.splitListsByChatId[chatId][index] = split;
        //         }
        //     }
        // },

        updateSplitInList: (
            state,
            action: PayloadAction<{ chatId: string; splitId: string; changes: Partial<SplitListItem> }>
        ) => {  
            const { chatId, splitId, changes } = action.payload;
            if (!state.splitListsByChatId[chatId]) return;
            const index = state.splitListsByChatId[chatId].findIndex(s => s.id === splitId);
            if (index === -1) return;
            state.splitListsByChatId[chatId][index] = {
                ...state.splitListsByChatId[chatId][index],
                ...changes,
            };
        },

        removeSplitFromList: (state, action: PayloadAction<{ chatId: string; splitId: string }>) => {
            const { chatId, splitId } = action.payload;
            if (!state.splitListsByChatId[chatId]) return;
            state.splitListsByChatId[chatId] = state.splitListsByChatId[chatId].filter(s => s.id !== splitId);
        }

    }
});

export const { setSplitList, addSplitToList, updateSplitInList, removeSplitFromList } = splitListSlice.actions;
export default splitListSlice.reducer;