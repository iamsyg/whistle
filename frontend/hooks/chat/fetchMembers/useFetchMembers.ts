// frontend/hooks/chat/fetchMembers/useFetchMembers.ts

import { useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";

import { setChatMembers  } from "@/store/slices/chat/membersSlice";
import { RootState } from "@/store/store";

export function useFetchMembers(chat_id: string) {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const isLoaded = useSelector(
        (state: RootState) => state.chatMembers.loadedChatIds[chat_id]
    );

    const fetchMembers = useCallback(async () => {

        if (isLoaded) {
            return;
        }

        setLoading(true);

        try {
            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;

            if (!token) {
                setLoading(false);
                Alert.alert('Authentication Error', 'Please log in again.', [
                    { text: 'OK', onPress: () => router.replace('/(auth)/login') }

                ]);
                return;
            }

            const res = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/${chat_id}/members`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err?.detail || "FETCH_FAILED");
            }

            const members = await res.json();

            dispatch(setChatMembers({
                chatId: chat_id,
                members: members
            }))

        } catch (error) {
            console.error("Error fetching chat members:", error);
            Alert.alert('Error', 'Failed to fetch chat members. Please try again later.');
        }

        setLoading(false);
    }, [chat_id, dispatch]);

    return { fetchMembers, loading };
}
