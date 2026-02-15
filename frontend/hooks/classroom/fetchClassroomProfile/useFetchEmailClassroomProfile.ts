// frontend/hooks/classroom/fetchClassroomProfile/useFetchEmailClassroomProfile.ts

import { useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useDispatch } from "react-redux";
import { setClassroomProfile, setLoading } from "@/store/slices/classroom/classroomProfileSlice";
import { ClassroomProfileType, Members } from "@/types/classroom/classroomProfileTypes";

export function useFetchEmailClassroomProfile(classroom_chat_id: string) {
    const [error, setError] = useState<string | null>(null);
    const dispatch = useDispatch();

    const fetchClassroomProfile = useCallback(async () => {
        setError(null);
        dispatch(setLoading(true));

        try {
            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;

            if (!token) {
                setLoading(false);
                dispatch(setLoading(false));
                Alert.alert('Authentication Error', 'Please log in again.', [
                    { text: 'OK', onPress: () => router.replace('/(auth)/login') }
                ]);
                return null;
            }

            console.log('Fetching email classroom profile for chat_id:', classroom_chat_id);

            const res = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/classroom/profile/email?classroom_chat_id=${classroom_chat_id}`,
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

            const raw = await res.json();

            console.log('Email classroom profile response:', raw);

            const normalizedMembers: Record<string, Members> = {};

            raw.members.forEach((member: Members) => {
                normalizedMembers[member.user_id] = member;
            });

            const result: ClassroomProfileType = {
                ...raw,
                members: normalizedMembers,
                admin_fields: raw.admin_fields || null, 
            };

            dispatch(setClassroomProfile({
                chat_id: classroom_chat_id,
                profile: result
            }));

            return result;

        } catch (err: any) {
            setError(err.message || "UNKNOWN_ERROR");
            return null;
        } finally {
            dispatch(setLoading(false));
        }
    }, [classroom_chat_id, dispatch]);

    return { fetchClassroomProfile, error };
}