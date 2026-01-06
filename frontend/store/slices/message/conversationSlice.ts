// store/slices/chat/conversationSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { messageState } from "./messageSlice";

interface ConversationState {
  selectedConversationId: string | null;
  messages: messageState[];
}

const initialState: ConversationState = {
  selectedConversationId: null,
  messages: [],
};

const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    setSelectedConversationId: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.selectedConversationId = action.payload;
      state.messages = []; // reset on switch (important)
    },
    setMessages: (state, action: PayloadAction<messageState[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<messageState>) => {
      state.messages.push(action.payload);
    },
    clearConversation: (state) => {
      state.selectedConversationId = null;
      state.messages = [];
    },
  },
});

export const {
  setSelectedConversationId,
  setMessages,
  addMessage,
  clearConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;
