// frontend/store/slices/message/conversationSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BackendMessage } from '@/types/backend/message';
import { UserConversation } from "@/types/conversation";
interface ConversationState {
  selectedConversationId: string | null;
  conversationType: 'direct' | 'group' | 'classroom' | null;
  contactProfileId: string | null;
  userAllConversations: UserConversation[]; // ✅ Store all conversation IDs
  messages: BackendMessage[];
  loading: boolean;
  typingUsers: string[]; // ✅ Track who's typing
}

const initialState: ConversationState = {
  selectedConversationId: null,
  conversationType: null,
  contactProfileId: null,
  userAllConversations: [],
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
      action: PayloadAction<{
        conversationId?: string; // ✅ optional
        type: 'direct' | 'group' | 'classroom'; // ✅ NOT nullable
        contactProfileId?: string;
      }>
    ) => {
      state.selectedConversationId =
        action.payload.conversationId ?? null;

      state.conversationType = action.payload.type;

      state.contactProfileId =
        action.payload.type === 'direct'
          ? action.payload.contactProfileId ?? null
          : null;

      state.messages = [];
    },

    setUserAllConversations: (
      state,
      action: PayloadAction<UserConversation[]>
    ) => {
      state.userAllConversations = action.payload;
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
    addConversation: (
  state,
  action: PayloadAction<UserConversation>
) => {
  state.userAllConversations.unshift(action.payload);
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
      state.conversationType = null;
      state.contactProfileId = null;
      state.messages = [];
      state.loading = false;
      state.typingUsers = [];
    },
  },
});

export const {
  setConversation,
  setUserAllConversations,
  addConversation,
  setMessages,
  addMessage,
  setLoading,
  addTypingUser,
  removeTypingUser,
  clearConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;
