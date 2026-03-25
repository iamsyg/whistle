// frontend/store/slices/auth/profileSlice.ts

import { UserProfile, ProfileLink } from '@/types/profile/userProfile';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// export interface ProfileLink {
//   id: string;
//   value: string;
// }

export interface ProfileState {
  userId: string | null;
  userProfile: UserProfile | null;
  isLoaded: boolean;

}

const initialState: ProfileState = {
  // userId: null,
  // name: '',
  // profilePictureUrl: '',
  // userName: '',
  // about: '',
  // profileLink: [],
  // profileCompleted: false,
  userId: null,
  userProfile: null,
  isLoaded: false,
};

// const profileSlice = createSlice({
//   name: 'profile',
//   initialState,
//   reducers: {
//     setUserId: (state, action: PayloadAction<string>) => {
//       // state.userId = action.payload;
//       state.userProfile?.userId = action.payload;
//     },
//     clearUser: (state) => {
//       // state.userId = null;
//       state.userProfile?.userId = null;
//     },
//     setName: (state, action: PayloadAction<string>) => {
//       // state.name = action.payload;
//       state.userProfile?.name = action.payload;
//     },
//     setProfilePictureUrl: (state, action: PayloadAction<string>) => {
//       // state.profilePictureUrl = action.payload;
//       state.userProfile?.profilePictureUrl = action.payload;
//     },
//     setUserName: (state, action: PayloadAction<string>) => {
//       // state.userName = action.payload;
//       state.userProfile?.userName = action.payload;
//     },
//     setAbout: (state, action: PayloadAction<string>) => {
//       state.about = action.payload;
//     },
//     setProfileLink: (state, action: PayloadAction<ProfileLink[]>) => {
//       const existingIds = new Set(state.profileLink.map(l => l.id));
//       action.payload.forEach(link => {
//         if (!existingIds.has(link.id)) {
//           state.profileLink.push(link);
//         }
//       });
//     },
//     saveProfile: (state) => {
//       state.profileCompleted =
//         !!state.name
//     },
//     clearProfileState: (state) => {
//       state.userId = '';
//       state.name = '';
//       state.profilePictureUrl = '';
//       state.userName = '';
//       state.about = '';
//       state.profileLink = [];
//       state.profileCompleted = false;
//     },
//   },
// });

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setUserProfile: (state, action: PayloadAction<UserProfile>) => {
      state.userProfile = action.payload;
      state.isLoaded = true;
    },

    clearUser: (state) => {
      state.userProfile = null;
      state.isLoaded = false;
    },

    // setUserId: (state, action: PayloadAction<string>) => {
    //   if (state.userProfile) {
    //     state.userProfile.userId = action.payload;
    //   }
    // },

    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload; // ✅ always works

      if (state.userProfile) {
        state.userProfile.userId = action.payload;
      }
    },

    setName: (state, action: PayloadAction<string>) => {
      if (state.userProfile) {
        state.userProfile.name = action.payload;
      }
    },

    setUserName: (state, action: PayloadAction<string>) => {
      if (state.userProfile) {
        state.userProfile.userName = action.payload;
      }
    },

    setProfilePictureUrl: (state, action: PayloadAction<string>) => {
      if (state.userProfile) {
        state.userProfile.profilePictureUrl = action.payload;
      }
    },

    setAbout: (state, action: PayloadAction<string>) => {
      if (state.userProfile) {
        state.userProfile.about = action.payload;
      }
    },

    setProfileLink: (state, action: PayloadAction<ProfileLink[]>) => {
      if (state.userProfile) {
        state.userProfile.profileLink = action.payload;
      }
    },

    updateUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.userProfile) {
        Object.assign(state.userProfile, action.payload);
      }
    },
  },
});

export const {
  setUserProfile,
  setUserId,
  clearUser,
  setName,
  setProfilePictureUrl,
  setUserName,
  setAbout,
  setProfileLink,
  updateUserProfile,
  // saveProfile,
  // clearProfileState,
} = profileSlice.actions;

export default profileSlice.reducer;