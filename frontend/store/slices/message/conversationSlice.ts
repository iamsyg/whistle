// frontend/store/slices/message/conversationSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BackendMessage } from '@/types/backend/message';
import { UserConversation } from "@/types/conversation";
import { getMessagePreview } from "@/utils/messageMapper";
interface ConversationState {
  // selectedConversationId: string | null;
  // subConversationType: 'direct' | 'group' | null;
  // contactProfileId: string | null;
  // userAllConversations: UserConversation[]; // ✅ Store all conversation IDs
  // messages: BackendMessage[];
  // loading: boolean;
  // typingUsers: string[]; // ✅ Track who's typing

  selectedChatId: string | null;
  subConversationType: 'direct' | 'group' | null;
  contactProfileId: string | null;

  chatIds: string[]; // Store just the IDs for ordering
  chatById: Record<string, UserConversation>; // ✅ Map for quick access (key = chat_id)
  chatMessages: Record<string, BackendMessage[]>; // key = chat_id

  loading: boolean;
  typingUsers: string[]; // ✅ Track who's typing in chats
}

const initialState: ConversationState = {
  selectedChatId: null,
  subConversationType: null,
  contactProfileId: null,
  chatIds: [],
  chatById: {},
  chatMessages: {},
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
        conversationId?: string;
        type: 'direct' | 'group';
        contactProfileId?: string;
      }>
    ) => {
      state.selectedChatId = action.payload.conversationId ?? null;
      state.subConversationType = action.payload.type;

      state.contactProfileId =
        action.payload.type === 'direct'
          ? action.payload.contactProfileId ?? null
          : null;
    },

    setUserAllConversations: (
      state,
      action: PayloadAction<UserConversation[]>
    ) => {
      state.chatIds = [];
      state.chatById = {};

      if (!Array.isArray(action.payload)) return;

      action.payload.forEach(c => {
        state.chatIds.push(c.chat_id);
        state.chatById[c.chat_id] = c;
      });
    },


    setMessages: (
      state,
      action: PayloadAction<{ chat_id: string; messages: BackendMessage[] }>) => {
      const chatId = action.payload.chat_id;
      state.chatMessages[chatId] = action.payload.messages;
    },
    
    addMessage: (
      state,
      action: PayloadAction<{ chat_id: string; message: BackendMessage }>
    ) => {
      const { chat_id, message } = action.payload;

      //  Guard against malformed payloads
      if (!chat_id || !message?.id) return;

      // 1️ Ensure message array exists
      if (!state.chatMessages[chat_id]) {
        state.chatMessages[chat_id] = [];
      }

      // 2️ Prevent duplicates safely
      const exists = state.chatMessages[chat_id].some(
        (m) => m?.id === message.id
      );

      if (!exists) {
        state.chatMessages[chat_id].push(message);
      }

      // 3️ Update preview if conversation exists
      const chat = state.chatById[chat_id];
      if (!chat) return;

      const currentLastTime = chat.last_message_at;
      const incomingTime = message.created_at;

      if (!currentLastTime || incomingTime > currentLastTime) {
        chat.last_message = {
          content: getMessagePreview(message),
          created_at: message.created_at,
          sender_id: message.sender_id,
        };

        chat.last_message_at = message.created_at;

        // Move chat to top ONLY if newer
        const index = state.chatIds.indexOf(chat_id);
        if (index !== -1) {
          state.chatIds.splice(index, 1);
        }

        state.chatIds.unshift(chat_id);
      }
    },

    removeMessage: (
      state,
      action: PayloadAction<{ chat_id: string; messageId: string }>
    ) => {
      const { chat_id, messageId } = action.payload;
      if (!state.chatMessages[chat_id]) return;
      state.chatMessages[chat_id] = state.chatMessages[chat_id].filter(
        m => m.id !== messageId
      );
    },

    addConversation: (
      state,
      action: PayloadAction<UserConversation>
    ) => {
      const id = action.payload.chat_id;

      if (!state.chatById[id]) {
        state.chatIds.unshift(id);
      }

      state.chatById[id] = action.payload;
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
      state.selectedChatId = null;
      state.subConversationType = null;
      state.contactProfileId = null;
      state.chatMessages = {};
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
  removeMessage,
  setLoading,
  addTypingUser,
  removeTypingUser,
  clearConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;
