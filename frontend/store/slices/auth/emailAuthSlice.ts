// /store/slices/auth/emailAuthSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EmailAuthState {
  emails: string[];          
  emailVerified: boolean;
}

const initialState: EmailAuthState = {
  emails: [],
  emailVerified: false,
};

const emailAuthSlice = createSlice({
  name: 'emailAuth',
  initialState,
  reducers: {
    setEmails: (state, action: PayloadAction<string[]>) => {
      state.emails = action.payload;
    },

    addEmail: (state, action: PayloadAction<string>) => {
      if (!state.emails.includes(action.payload)) {
        state.emails.push(action.payload);
      }
    },

    removeEmail: (state, action: PayloadAction<string>) => {
      state.emails = state.emails.filter(
        (email) => email !== action.payload
      );
    },

    setEmailVerified: (state, action: PayloadAction<boolean>) => {
      state.emailVerified = action.payload;
    },

    clearEmailAuthState: () => initialState,
  },
});

export const {
  setEmails,
  addEmail,
  removeEmail,
  setEmailVerified,
  clearEmailAuthState,
} = emailAuthSlice.actions;

export default emailAuthSlice.reducer;