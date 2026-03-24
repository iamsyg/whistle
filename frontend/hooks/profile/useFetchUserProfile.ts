// frontend/hooks/profile/useFetchUserProfile.ts

import { useState, useCallback } from "react";
import { Alert } from "react-native/Libraries/Alert/Alert";
import { supabase } from "@/utils/supabase";
import { setUserProfile } from "@/store/slices/profile/profileSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";

export const useFetchUserProfile = (userId: string) => {

    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const isLoaded = useSelector(
        (state: RootState) => state.userProfile.isLoaded
    )

    const fetchUserProfile = useCallback(async () => {

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
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/user/profile/${userId}`,
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
            dispatch(setUserProfile(userProfile));

        } catch (err) {
            console.error("Error fetching user profile:", err);
            Alert.alert("Error", "Failed to fetch user profile. Please try again.");
        } finally {
            setLoading(false);
        }

    }, [userId, isLoaded, dispatch]);

    return { fetchUserProfile, loading };
}