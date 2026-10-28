// frontend/hooks/user/settings/privacy/useFetchPrivacySettings.ts

import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { supabase } from "@/utils/supabase";
import { setPrivacyLoading, setPrivacySettings, setPrivacyError } from '@/store/slices/user/settings/privacy/privacySettingsSlice';
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";

export const useFetchPrivacySettings = () => {

    const dispatch = useDispatch();

    const isLoaded = useSelector(
        (state: RootState) => state.privacySettings.isLoaded
    );

    const loading = useSelector(
        (state: RootState) => state.privacySettings.loading
    )

    const fetchPrivacySettings = useCallback(async () => {

        if (isLoaded && !loading) return;

        dispatch(setPrivacyLoading(true));

        try {

            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;

            if (!token) {
                throw new Error("Authentication expired");
            }

            const res = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/user/settings/privacy`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Failed to fetch privacy settings");
            }

            const privacySettings = await res.json();

            dispatch(setPrivacySettings(privacySettings.data));
            // dispatch(setUserProfile(mappedProfile));
            // dispatch(setUserId(userProfile.id));

        } catch (err) {
            console.error("Error fetching privacy settings:", err);
            Alert.alert("Error", "Failed to fetch privacy settings. Please try again.");
            dispatch(setPrivacyError("Failed to fetch privacy settings. Please try again."));
        } finally {
            dispatch(setPrivacyLoading(false));
        }

    }, [isLoaded, dispatch]);

    return { fetchPrivacySettings, loading };
}