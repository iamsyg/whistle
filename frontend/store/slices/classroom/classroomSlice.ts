// frontend/store/slices/classroom/classroomSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ClassroomMeta } from "@/types/classroom";
import { ClassroomBackendMessage } from "@/types/backend/classroomMessage";

interface ClassroomState {
  classrooms: Record<string, ClassroomMeta>; // key = chat_id
  selectedClassroomId: string | null;
  classroomMessages: Record<string, ClassroomBackendMessage[]>; // key = chat_id
  loading: boolean;
}

const initialState: ClassroomState = {
  classrooms: {},
  selectedClassroomId: null,
  classroomMessages: {},
  loading: false,
};

const classroomSlice = createSlice({
  name: "classroom",
  initialState,
  reducers: {
    upsertClassroom: (
      state,
      action: PayloadAction<ClassroomMeta>
    ) => {
      state.classrooms[action.payload.chat_id] = action.payload;
    },

    setAllClassrooms: (
      state,
      action: PayloadAction<ClassroomMeta[] | undefined | null>
    ) => {

      if (!Array.isArray(action.payload)) return;

      action.payload.forEach(c => {
        state.classrooms[c.chat_id] = c;
      });
    },

    setSelectedClassroom: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.selectedClassroomId = action.payload;
    },

    updateClassroomProfile: (
      state,
      action: PayloadAction<{
        chat_id: string;
        changes: Partial<ClassroomMeta>;
      }>
    ) => {
      const classroom = state.classrooms[action.payload.chat_id];
      if (classroom) {
        Object.assign(classroom, action.payload.changes);
      }
    },

    removeClassroomProfile: (state, action: PayloadAction<string>) => {
      delete state.classrooms[action.payload];
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
      const chatId = action.payload.chat_id;
      if (!state.classroomMessages[chatId]) {
        state.classroomMessages[chatId] = [];
      }

      const exists = state.classroomMessages[chatId]
        .some(m => m.id === action.payload.message.id);

      if (!exists) {
        state.classroomMessages[chatId].push(action.payload.message);
      }
    },


    clearClassrooms: (state) => {
      state.classrooms = {};
      state.classroomMessages = {};
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
  updateClassroomProfile,
  removeClassroomProfile,
  setClassroomLoading,
  setMessages,
  addMessage,
  clearClassrooms,
  clearSelectedClassroom,
} = classroomSlice.actions;

export default classroomSlice.reducer;