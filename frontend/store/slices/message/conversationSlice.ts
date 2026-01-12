// store/slices/chat/conversationSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BackendMessage } from '@/types/backend/message';

interface ConversationState {
  selectedConversationId: string | null;
  contactProfileId: string | null;
  userAllConversationIds: string[]; // ✅ Store all conversation IDs
  messages: BackendMessage[];
  loading: boolean;
  typingUsers: string[]; // ✅ Track who's typing
}

const initialState: ConversationState = {
  selectedConversationId: null,
  contactProfileId: null,
  userAllConversationIds: [], // ✅ Initialize as empty array
  messages: [],
  loading: false,
  typingUsers: [],
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
    setUserAllConversationIds: (
      state,
      action: PayloadAction<string[]>
    ) => {
      state.userAllConversationIds = action.payload;
    },
    setMessages: (state, action: PayloadAction<BackendMessage[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<BackendMessage>) => {
      // ✅ Prevent duplicate messages
      const exists = state.messages.some(m => m.id === action.payload.id);
      if (!exists) {
        state.messages.push(action.payload);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    addTypingUser: (state, action: PayloadAction<string>) => {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },
    
    removeTypingUser: (state, action: PayloadAction<string>) => {
      state.typingUsers = state.typingUsers.filter(id => id !== action.payload);
    },
    clearConversation: (state) => {
      state.selectedConversationId = null;
      state.contactProfileId = null;
      state.messages = [];
      state.loading = false;
      state.typingUsers = [];
    },
  },
});

export const {
  setConversation,
  setContactProfileId,
  setSelectedConversationId,
  setUserAllConversationIds,
  setMessages,
  addMessage,
  setLoading,
  addTypingUser,
  removeTypingUser,
  clearConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;
