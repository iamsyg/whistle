// frontend/store/slices/classroom/classroomSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ClassroomProfile } from "@/types/classroom";

interface ClassroomState {
  classrooms: Record<string, ClassroomProfile>; // key = chat_id
  loading: boolean;
}

const initialState: ClassroomState = {
  classrooms: {},
  loading: false,
};

const classroomSlice = createSlice({
  name: "classroom",
  initialState,
  reducers: {
    upsertClassroom: (
      state,
      action: PayloadAction<ClassroomProfile>
    ) => {
      state.classrooms[action.payload.chat_id] = action.payload;
    },

    setAllClassrooms: (
        state,
        action: PayloadAction<ClassroomProfile[]>
        ) => {
        action.payload.forEach(c => {
            state.classrooms[c.chat_id] = c;
        });
    },

    updateClassroomProfile: (
      state,
      action: PayloadAction<{
        chat_id: string;
        changes: Partial<ClassroomProfile>;
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

    clearClassrooms: (state) => {
      state.classrooms = {};
    },
  },
});

export const {
  upsertClassroom,
  setAllClassrooms,
  updateClassroomProfile,
  removeClassroomProfile,
  setClassroomLoading,
  clearClassrooms,
} = classroomSlice.actions;

export default classroomSlice.reducer;