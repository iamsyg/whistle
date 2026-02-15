// frontend/store/slices/classroom/classroomSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// import { ClassroomMeta } from "@/types/classroom";
import { UserConversation } from "@/types/conversation";
import { ClassroomBackendMessage } from "@/types/backend/classroomMessage";
import { getMessagePreview } from "@/utils/messageMapper";

interface ClassroomState {
  // classrooms: Record<string, ClassroomMeta>; // key = chat_id
  // selectedClassroomId: string | null;
  // classroomMessages: Record<string, ClassroomBackendMessage[]>; // key = chat_id
  // loading: boolean;
  selectedClassroomId: string | null;
  subClassroomType: 'email-classroom' | 'non-email-classroom' | null;

  classroomIds: string[]; // Store just the IDs for ordering
  classroomById: Record<string, UserConversation>; // ✅ Map for quick access (key = chat_id)
  classroomMessages: Record<string, ClassroomBackendMessage[]>; // key = chat_id

  loading: boolean;
  typingUsers: string[]; // Track who's typing in classrooms
}

const initialState: ClassroomState = {
  // classrooms: {},
  // selectedClassroomId: null,
  // classroomMessages: {},
  // loading: false,

  selectedClassroomId: null,
  subClassroomType: null,
  classroomIds: [],
  classroomById: {},
  classroomMessages: {},
  loading: false,
  typingUsers: [],
};

const classroomSlice = createSlice({
  name: "classroom",
  initialState,
  reducers: {
    // upsertClassroom: (
    //   state,
    //   action: PayloadAction<UserConversation>
    // ) => {
    //   // state.classrooms[action.payload.chat_id] = action.payload;
    //   state.classroomById[action.payload.chat_id] = action.payload;
    //   const id = action.payload.chat_id;

    //   if (!state.classroomById[id]) {
    //     state.classroomIds.push(id);
    //   }

    //   state.classroomById[id] = action.payload;
    // },

    upsertClassroom: (
      state,
      action: PayloadAction<UserConversation>
    ) => {
      const id = action.payload.chat_id;

      if (!state.classroomById[id]) {
        state.classroomIds.unshift(id);
      }

      state.classroomById[id] = action.payload;
    },


    setAllClassrooms: (
      state,
      action: PayloadAction<UserConversation[]>
    ) => {
      state.classroomIds = [];
      state.classroomById = {};

      if (!Array.isArray(action.payload)) return;

      action.payload.forEach(c => {
        state.classroomById[c.chat_id] = c;
        if (!state.classroomIds.includes(c.chat_id)) {
          state.classroomIds.push(c.chat_id);
        }
      });
    },

    setSelectedClassroom: (
      state,
      action: PayloadAction<{
        conversationId?: string;
        type: 'email-classroom' | 'non-email-classroom';
      }>
    ) => {

      state.selectedClassroomId = action.payload.conversationId ?? null;
      state.subClassroomType = action.payload.type;
    },

    setClassroomLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setMessages: (
      state,
      action: PayloadAction<{ chat_id: string; messages: ClassroomBackendMessage[] }>
    ) => {
      state.classroomMessages[action.payload.chat_id] = action.payload.messages;
    },

    addMessage: (
      state,
      action: PayloadAction<{ chat_id: string; message: ClassroomBackendMessage }>
    ) => {
      const { chat_id, message } = action.payload;

      if (!chat_id || !message?.id) return;

      if (!state.classroomMessages[chat_id]) {
        state.classroomMessages[chat_id] = [];
      }

      const exists = state.classroomMessages[chat_id]
        .some(m => m.id === message.id);

      if (!exists) {
        state.classroomMessages[chat_id].push(message);
      }

      const classroom = state.classroomById[chat_id];
      if (!classroom) return;

      const currentLastTime = classroom.last_message_at;
      const incomingTime = message.created_at;

      if (!currentLastTime || incomingTime > currentLastTime) {

        classroom.last_message = {
          content: getMessagePreview(message),
          created_at: message.created_at,
          sender_id: message.sender_id,
        };

        classroom.last_message_at = message.created_at;

        // Move to top efficiently
        const index = state.classroomIds.indexOf(chat_id);
        if (index !== -1) {
          state.classroomIds.splice(index, 1);
        }
        state.classroomIds.unshift(chat_id);
      }
    },

    addTypingUser: (state, action: PayloadAction<string>) => {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },

    removeTypingUser: (state, action: PayloadAction<string>) => {
      state.typingUsers = state.typingUsers.filter(id => id !== action.payload);
    },


    clearClassrooms: (state) => {
      state.classroomById = {};
      state.classroomIds = [];
      state.classroomMessages = {};
      state.selectedClassroomId = null;
      state.subClassroomType = null;
      state.typingUsers = [];
      state.loading = false;
    },

    clearSelectedClassroom: (state) => {
      state.selectedClassroomId = null;
    },
  },
});

export const {
  upsertClassroom,
  setAllClassrooms,
  setSelectedClassroom,
  setClassroomLoading,
  setMessages,
  addMessage,
  addTypingUser,
  removeTypingUser,
  clearClassrooms,
  clearSelectedClassroom,
} = classroomSlice.actions;

export default classroomSlice.reducer;