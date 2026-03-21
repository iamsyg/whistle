// frontend/hooks/chat/split/useFetchSplitList.ts

import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setSplitList } from "@/store/slices/chat/split/splitListSlice";
import { supabase } from "@/utils/supabase";

export function useFetchSplitList(chat_id: string) {

    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const isLoaded = useSelector(
        (state: RootState) => state.splitList.isSplitListLoaded[chat_id]
    )

    const fetchSplitList = useCallback(async () => {

        if (isLoaded) {
            return;
        }

        setLoading(true);

        try {

            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;

            if (!token) {
                throw new Error("Authentication expired");
            }

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/split/list/${chat_id}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // const result = await response.json();
            const result = await response.json().catch(() => null);
            
            if (!response.ok) {
                console.error("Failed to fetch splits:", result);
                throw new Error(result.detail || "Failed to fetch splits");
            }

            dispatch(setSplitList({
                chatId: chat_id,
                splits: result,
            }))

            console.log("Split list fetched successfully:", result);


        }
        catch (error) {
            console.error("Error fetching split list:", error);
            throw error;
        }
        finally {
            setLoading(false);
        }

    }, [chat_id, dispatch, isLoaded]);

    return { fetchSplitList, loading };
}