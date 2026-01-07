// store/slices/chat/messageDraftSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MessageDraft } from '@/types/frontend/message';

const initialState: MessageDraft = {
  text: '',
  type: 'text',
  metadata: {},
};

const messageDraftSlice = createSlice({
  name: 'messageDraft',
  initialState,
  reducers: {
    setText: (state, action: PayloadAction<string>) => {
      state.text = action.payload;
    },
    setType: (
      state,
      action: PayloadAction<'text' | 'image' | 'document'>
    ) => {
      state.type = action.payload;
    },
    setMetadata: (state, action: PayloadAction<Record<string, any>>) => {
      state.metadata = action.payload;
    },
    clearDraft: () => initialState,
  },
});

export const {
  setText,
  setType,
  setMetadata,
  clearDraft,
} = messageDraftSlice.actions;

export default messageDraftSlice.reducer;
