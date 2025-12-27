// /store/slices/auth/profileSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ProfileLink {
  id: string;
  value: string;
}

export interface ProfileState {
  userId: string;
  name: string;
  profilePictureUrl: string;
  userName: string;
  about: string;
  profileLink: ProfileLink[];
  profileCompleted: boolean;
}

const initialState: ProfileState = {
  userId: '',
  name: '',
  profilePictureUrl: '',
  userName: '',
  about: '',
  profileLink: [],
  profileCompleted: false,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
    },
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    setProfilePictureUrl: (state, action: PayloadAction<string>) => {
      state.profilePictureUrl = action.payload;
    },
    setUserName: (state, action: PayloadAction<string>) => {
      state.userName = action.payload;
    },
    setAbout: (state, action: PayloadAction<string>) => {
      state.about = action.payload;
    },
    setProfileLink: (state, action: PayloadAction<ProfileLink[]>) => {
      const existingIds = new Set(state.profileLink.map(l => l.id));
      action.payload.forEach(link => {
        if (!existingIds.has(link.id)) {
          state.profileLink.push(link);
        }
      });
    },
    saveProfile: (state) => {
      state.profileCompleted =
        !!state.name
    },
    clearProfileState: (state) => {
      state.userId = '';
      state.name = '';
      state.profilePictureUrl = '';
      state.userName = '';
      state.about = '';
      state.profileLink = [];
      state.profileCompleted = false;
    },
  },
});

export const {
  setUserId,
  setName,
  setProfilePictureUrl,
  setUserName,
  setAbout,
  setProfileLink,
  saveProfile,
  clearProfileState,
} = profileSlice.actions;

export default profileSlice.reducer;