// store/slices/chat/conversationSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BackendMessage } from '@/types/backend/message';

interface ConversationState {
  selectedConversationId: string | null;
  contactProfileId: string | null;
  messages: BackendMessage[];
   loading: boolean;
}

const initialState: ConversationState = {
  selectedConversationId: null,
  contactProfileId: null,
  messages: [],
  loading: false,
};

const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {

    // Set both contactProfileId and selectedConversationId
    setConversation: (
      state,
      action: PayloadAction<{ contactProfileId: string; conversationId?: string }>
    ) => {
      state.contactProfileId = action.payload.contactProfileId;
      state.selectedConversationId = action.payload.conversationId || null;
      state.messages = []; // Reset messages when switching conversations
    },
    setContactProfileId: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.contactProfileId = action.payload;
    },
    setSelectedConversationId: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.selectedConversationId = action.payload;
      state.messages = []; // reset on switch (important)
    },
    setMessages: (state, action: PayloadAction<BackendMessage[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<BackendMessage>) => {
      state.messages.push(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearConversation: (state) => {
      state.selectedConversationId = null;
      state.messages = [];
    },
  },
});

export const {
  setConversation,
  setContactProfileId,
  setSelectedConversationId,
  setMessages,
  addMessage,
  setLoading,
  clearConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;
