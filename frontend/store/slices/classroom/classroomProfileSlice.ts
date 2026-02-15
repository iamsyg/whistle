// frontend/store/slices/classroom/classroomProfileSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ClassroomProfileType } from "@/types/classroom/classroomProfileTypes";

interface ClassroomProfileState {
    profile: Record<string, ClassroomProfileType>;
    loading: boolean;
}

const initialState: ClassroomProfileState = {
    profile: {},
    loading: false,
};

const classroomProfileSlice = createSlice({
    name: "classroomProfile",
    initialState,
    reducers: {
        setClassroomProfile: (
            state,
            action: PayloadAction<{ chat_id: string; profile: ClassroomProfileType }>
        ) => {
            state.profile[action.payload.chat_id] = action.payload.profile;
        },

        // Recheck this reducer logic, especially for members update

        updateClassroomProfile: (
            state,
            action: PayloadAction<{
                chat_id: string;
                changes: Partial<ClassroomProfileType>;
            }>
        ) => {
            const { chat_id, changes } = action.payload;
            const profile = state.profile[chat_id];
            if (!profile) return;

            // Root merge
            if (changes.title !== undefined) profile.title = changes.title;
            if (changes.description !== undefined) profile.description = changes.description;
            if (changes.meta !== undefined) profile.meta = changes.meta;

            // Admin fields deep merge
            if (changes.admin_fields) {
                profile.admin_fields = {
                    ...profile.admin_fields,
                    ...changes.admin_fields,
                };
            }

            // Member merge (important part)
            if (changes.members) {
                Object.entries(changes.members).forEach(([user_id, member]) => {
                    profile.members[user_id] = {
                        ...profile.members[user_id],
                        ...member,
                    };
                });
            }

            // Pagination
            if (changes.pagination) {
                profile.pagination = changes.pagination;
            }
        },

        removeClassroomProfile: (state, action: PayloadAction<string>) => {
            delete state.profile[action.payload];
        },

        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },

        clearClassroomProfiles: (state) => {
            state.profile = {};
        },
    },
});

export const {
    setClassroomProfile,
    updateClassroomProfile,
    removeClassroomProfile,
    setLoading,
    clearClassroomProfiles,
} = classroomProfileSlice.actions;

export default classroomProfileSlice.reducer;
