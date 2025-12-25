// /store/slices/auth/emailAuthSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EmailAuthState {
  email: string;
  emailVerified: boolean;
}

const initialState: EmailAuthState = {
  email: '',
  emailVerified: false,
};

const emailAuthSlice = createSlice({
  name: 'emailAuth',
  initialState,
  reducers: {
    setEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
    },
    setEmailVerified: (state, action: PayloadAction<boolean>) => {
      state.emailVerified = action.payload;
    },
    clearEmailAuthState: (state) => {
      state.email = '';
      state.emailVerified = false;
    },
  },
});

export const {
  setEmail,
  setEmailVerified,
  clearEmailAuthState,
} = emailAuthSlice.actions;

export default emailAuthSlice.reducer;