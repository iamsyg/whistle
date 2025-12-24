// /store/slices/auth/phoneAuthSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  phoneNumber: string;
  countryCode: string;
  phoneNumberVerified: boolean;
}

const initialState: AuthState = {
  phoneNumber: '',
  countryCode: '+91',
  phoneNumberVerified: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPhoneNumber: (state, action: PayloadAction<string>) => {
      state.phoneNumber = action.payload;
    },
    setCountryCode: (state, action: PayloadAction<string>) => {
      state.countryCode = action.payload;
    },
    setPhoneNumberVerified: (state, action: PayloadAction<boolean>) => {
      state.phoneNumberVerified = action.payload;
    },
    clearAuthState: (state) => {
      state.phoneNumber = '';
      state.countryCode = '+91';
      state.phoneNumberVerified = false;
    },
  },
});

export const {
  setPhoneNumber,
  setCountryCode,
  setPhoneNumberVerified,
  clearAuthState,
} = authSlice.actions;

export default authSlice.reducer;
