import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Contact } from '@/types/contact';

interface ContactsState {
  all: Contact[];                 // all phone contacts (processed)
  registered: Contact[];          // only app users
  byProfileId: Record<string, Contact>;
  loading: boolean;
  lastSyncedAt: number | null;
}

const initialState: ContactsState = {
  all: [],
  registered: [],
  byProfileId: {},
  loading: false,
  lastSyncedAt: null,
};

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setContacts(state, action: PayloadAction<Contact[]>) {
      state.all = action.payload;
      state.registered = action.payload.filter(c => c.isRegistered);

      state.byProfileId = {};
      for (const contact of state.registered) {
        if (contact.profileId) {
          state.byProfileId[contact.profileId] = contact;
        }
      }

      state.lastSyncedAt = Date.now();
      state.loading = false;
    },

    setContactsLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    clearContacts(state) {
      state.all = [];
      state.registered = [];
      state.byProfileId = {};
      state.lastSyncedAt = null;
    },

    updateContact(state, action: PayloadAction<Contact>) {
      const index = state.all.findIndex(
        c => c.contactId === action.payload.contactId
      );
      if (index !== -1) {
        state.all[index] = action.payload;
      }

      if (action.payload.profileId) {
        state.byProfileId[action.payload.profileId] = action.payload;
      }
    },
  },
});

export const {
  setContacts,
  setContactsLoading,
  clearContacts,
  updateContact,
} = contactsSlice.actions;

export default contactsSlice.reducer;
