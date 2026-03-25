// frontend/hooks/profile/useFetchUserProfile.ts

import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { supabase } from "@/utils/supabase";
import { setUserId, setUserProfile } from "@/store/slices/auth/profileSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";

export const useFetchUserProfile = (userId: string) => {

    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const isLoaded = useSelector(
        (state: RootState) => state.profile.isLoaded
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

            const mappedProfile = {
                userId: userProfile.id,
                name: userProfile.name ?? "",
                userName: userProfile.username ?? "",
                profilePictureUrl: userProfile.avatar_url ?? "",
                phoneNumber: userProfile.phone_number ?? "",
                about: userProfile.about ?? "",
                profileLink: userProfile.profile_links ?? [],
                primary_email: userProfile.primary_email ?? null,
                emails: userProfile.emails ?? [],
                profileCompleted: !!userProfile.name,
                };
                
            dispatch(setUserProfile(mappedProfile));
            dispatch(setUserId(userProfile.id));

        } catch (err) {
            console.error("Error fetching user profile:", err);
            Alert.alert("Error", "Failed to fetch user profile. Please try again.");
        } finally {
            setLoading(false);
        }

    }, [userId, isLoaded, dispatch]);

    return { fetchUserProfile, loading };
}