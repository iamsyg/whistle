// /store/slices/auth/messageSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface messageState {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'image' | 'document' //| 'task' | 'split';
  metadata?: any;
}

const initialState: messageState = {
    id: '',
    text: '',
    senderId: '',
    timestamp: new Date().toISOString(),
    isRead: false,
    type: 'text',
    metadata: {},
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    setMessageId: (state, action: PayloadAction<string>) => {
      state.id = action.payload;
    },
    setMessageText: (state, action: PayloadAction<string>) => {
      state.text = action.payload;
    },
    setMessageSenderId: (state, action: PayloadAction<string>) => {
      state.senderId = action.payload;
    },
    setMessageTimestamp: (state, action: PayloadAction<string>) => {
    state.timestamp = action.payload;
    },
    setMessageIsRead: (state, action: PayloadAction<boolean>) => {
      state.isRead = action.payload;
    },
    setMessageType: (state, action: PayloadAction<'text' | 'image' | 'document'>) => {
      state.type = action.payload;      
    },
    setMessageMetadata: (state, action: PayloadAction<any>) => {
      state.metadata = action.payload;
    },
    clearMessageState: (state) => {
      state.id = '';
      state.text = '';
      state.senderId = '';
      state.timestamp = new Date().toISOString();
      state.isRead = false;
      state.type = 'text';
      state.metadata = {};
    },
  },
});

export const {
    setMessageId,
    setMessageText,
    setMessageSenderId,
    setMessageTimestamp,
    setMessageIsRead,
    setMessageType,
    setMessageMetadata,
    clearMessageState,
} = messageSlice.actions;

export default messageSlice.reducer;