// frontend/store/slices/classroom/classroomMembersCard.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { classroomMembersCardTypes } from "@/types/classroom/classroomMembersCardTypes";

interface ClassroomMembersCardState {
  members: Record<string, classroomMembersCardTypes>; // key = user_id
  selectedMemberId: string | null;
  loading: boolean;
}

const initialState: ClassroomMembersCardState = {
  members: {},
  selectedMemberId: null,
  loading: false,
};

const classroomMembersCardSlice = createSlice({
  name: "classroomMembersCard",
  initialState,
  reducers: {
    upsertMembersCard: (
      state,
      action: PayloadAction<classroomMembersCardTypes>
    ) => {
      state.members[action.payload.user_id] = action.payload;
    },

    setAllMembers: (
      state,
      action: PayloadAction<classroomMembersCardTypes[]>
    ) => {
      action.payload.forEach(c => {
        state.members[c.user_id] = c;
      });
    },

    setSelectedMember: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.selectedMemberId = action.payload;
    },

    // updateMembersCard: (
    //   state,
    //   action: PayloadAction<{
    //     user_id: string;
    //     changes: Partial<classroomMembersCardTypes>;
    //   }>
    // ) => {
    //   const member = state.members[action.payload.user_id];
    //   if (member) {
    //     Object.assign(member, action.payload.changes);
    //   }
    // },

    removeMembersCard: (state, action: PayloadAction<string>) => {
      delete state.members[action.payload];
    },

    clearMembers: (state) => {
      state.members = {};
    },

    // clearSelectedMember: (state) => {
    //   state.selectedMemberId = null;
    // },
  },
});

export const {
  upsertMembersCard,
  setAllMembers,
  setSelectedMember,
//   updateMembersCard,
  removeMembersCard,
  clearMembers,
//   clearSelectedMember,
} = classroomMembersCardSlice.actions;

export default classroomMembersCardSlice.reducer;