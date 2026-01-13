// // ./store/store.ts

// import { configureStore } from '@reduxjs/toolkit';
// import authReducer from './slices/auth/phoneAuthSlice';
// import emailAuthReducer from './slices/auth/emailAuthSlice';
// import profileReducer from './slices/auth/profileSlice';
// import conversationReducer from './slices/message/conversationSlice';
// import messageRuducer from './slices/message/messageSlice';
// import contactsReducer from './slices/contacts/contactsSlice';

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     emailAuth: emailAuthReducer,
//     profile: profileReducer,
//     conversation: conversationReducer,
//     message: messageRuducer,
//     contacts: contactsReducer,
//   },
// });

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;









// store/store.ts

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
} from 'redux-persist';

import authReducer from './slices/auth/phoneAuthSlice';
import emailAuthReducer from './slices/auth/emailAuthSlice';
import profileReducer from './slices/auth/profileSlice';
import conversationReducer from './slices/message/conversationSlice';
import messageReducer from './slices/message/messageSlice';
import contactsReducer from './slices/contacts/contactsSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  emailAuth: emailAuthReducer,
  profile: profileReducer,
  conversation: conversationReducer,
  message: messageReducer,
  contacts: contactsReducer,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['profile', 'conversation', 'contacts'], 
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
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
