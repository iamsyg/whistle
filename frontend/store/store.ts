// frontend/store/store.ts

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  createMigrate,
} from 'redux-persist';

import authReducer from './slices/auth/phoneAuthSlice';
import emailAuthReducer from './slices/auth/emailAuthSlice';
import profileReducer from './slices/auth/profileSlice';
import conversationReducer from './slices/message/conversationSlice';
import messageReducer from './slices/message/messageSlice';
import contactsReducer from './slices/contacts/contactsSlice';
import classroomReducer from './slices/classroom/classroomSlice';
import classroomMembersCardReducer from './slices/classroom/classroomMembersCard';

const rootReducer = combineReducers({
  auth: authReducer,
  emailAuth: emailAuthReducer,
  profile: profileReducer,
  conversation: conversationReducer,
  message: messageReducer,
  contacts: contactsReducer,
  classroom: classroomReducer,
  classroomMembersCard: classroomMembersCardReducer,
});

// Migration strategy for state shape changes
const migrations = {
  0: (state: any) => {
    // Initial migration: do nothing
    return state;
  },

  1: (state: any) => {
  if (!state?.conversation) return state;

  return {
    ...state,
    conversation: {
      ...state.conversation,
      conversationType:
        state.conversation.conversationType ?? null,
    },
  };
},

2: (state: any) => {
    if (!state?.emailAuth) return state;

    return {
      ...state,
      emailAuth: {
        ...state.emailAuth,
        selectedEmail:
          state.emailAuth.selectedEmail ??
          state.emailAuth.emails?.[0] ??
          null,
      },
    };
  },

  3: (state: any) => {
    if (!state?.conversation) return state;

    const { conversationType, ...restConversation } = state.conversation;

    let newType: 'direct' | 'group' | null = null;

    if (conversationType === 'direct' || conversationType === 'group') {
      newType = conversationType;
    }

    return {
      ...state,
      conversation: {
        ...restConversation,
        subConversationType: newType,
      },
    };
  },
};



const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  version: 2,
  migrate: createMigrate(migrations, { debug: __DEV__ }),
  whitelist: ['profile', 'conversation', 'contacts', 'emailAuth'],
  blacklist: ['auth'], // Don't persist auth tokens
  timeout: 10000, // 10 second timeout
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__, // Only enable in development
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;