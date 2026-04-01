// frontend/store/slices/user/settings/privacy/privacySettingsSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PrivacySettings } from '@/types/user/settings/privacy/privacySettings';

interface PrivacySettingsState {
    settings: PrivacySettings | null;
    loading: boolean;
    error: string | null;
    isLoaded: boolean;
}

const initialState: PrivacySettingsState = {
    settings: null,
    loading: false,
    error: null,
    isLoaded: false,
};

const privacySettingsSlice = createSlice({
    name: 'privacySettings',
    initialState,

    reducers: {
        // Set all settings
        setPrivacySettings(state, action: PayloadAction<PrivacySettings>) {
            state.settings = action.payload;
            state.loading = false;
            state.error = null;
            state.isLoaded = true;
        },

        // Update single field
        updatePrivacySetting<K extends keyof PrivacySettings>(
            state: PrivacySettingsState,
            action: PayloadAction<{ key: K; value: PrivacySettings[K] }>
        ) {
            if (state.settings) {
                state.settings[action.payload.key] = action.payload.value;
            }
        },

        // Toggle boolean settings
        togglePrivacySetting(
            state,
            action: PayloadAction<'read_receipts_enabled' | 'block_unknown_messages'>
        ) {
            if (state.settings) {
                const key = action.payload;
                state.settings[key] = !state.settings[key];
            }
        },

        // Loading state
        setPrivacyLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;

            if (action.payload) {
                state.isLoaded = false; // optional but clean
            }
        },

        // Error handling
        setPrivacyError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
            state.loading = false;
            state.isLoaded = false;
        },

        // Reset (logout case)
        resetPrivacySettings(state) {
            state.settings = null;
            state.loading = false;
            state.error = null;
            state.isLoaded = false;
        }
    },
});

export const {
    setPrivacySettings,
    updatePrivacySetting,
    togglePrivacySetting,
    setPrivacyLoading,
    setPrivacyError,
    resetPrivacySettings,
} = privacySettingsSlice.actions;

export default privacySettingsSlice.reducer;