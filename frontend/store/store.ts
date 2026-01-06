// ./store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth/phoneAuthSlice';
import emailAuthReducer from './slices/auth/emailAuthSlice';
import profileReducer from './slices/auth/profileSlice';
import conversationReducer from './slices/message/conversationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    emailAuth: emailAuthReducer,
    profile: profileReducer,
    conversation: conversationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;