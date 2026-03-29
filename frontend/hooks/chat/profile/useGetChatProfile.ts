// frontend/hooks/chat/profile/useGetChatProfile.ts

import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { supabase } from "@/utils/supabase";
import { setChatProfile } from "@/store/slices/chat/profile/chatProfileSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";

export const useGetChatProfile = (chatId: string) => {

    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const isLoaded = useSelector(
        (state: RootState) => state.chatProfile.isChatProfileLoaded[chatId]
    );

    const getUserProfile = useCallback(async () => {

        if (isLoaded) {
            return;
        };

        setLoading(true);

        try {

            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;

            if (!token) {
                throw new Error("Authentication expired");
            }

            const res = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/profile/${chatId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Failed to fetch user profile");
            }

            const userProfile = await res.json();

            dispatch(setChatProfile({
                chatId,
                profile: userProfile,
            }));

        } catch (err) {
            console.error("Error fetching user profile:", err);
            Alert.alert("Error", "Failed to fetch user profile. Please try again.");
        } finally {
            setLoading(false);
        }

    }, [chatId, isLoaded, dispatch]);

    return { getUserProfile, loading };
}