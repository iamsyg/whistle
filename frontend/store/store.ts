// ./store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth/phoneAuthSlice';
import emailAuthReducer from './slices/auth/emailAuthSlice';
import profileReducer from './slices/auth/profileSlice';
import conversationReducer from './slices/message/conversationSlice';
import messageRuducer from './slices/message/messageSlice';
import contactsReducer from './slices/contacts/contactsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    emailAuth: emailAuthReducer,
    profile: profileReducer,
    conversation: conversationReducer,
    message: messageRuducer,
    contacts: contactsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;