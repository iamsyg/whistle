// frontend/hooks/classroom/messages/useGetClassroomMessage.ts

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "@/utils/supabase";
import {
    setMessages,
    setClassroomLoading,
} from "@/store/slices/classroom/classroomSlice";
import { ClassroomBackendMessage } from "@/types/backend/classroomMessage";

interface ClassroomMessageState {
    loading: boolean;
}

function useGetClassroomMessages(chatId: string | null): ClassroomMessageState {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!chatId) return;

        const getMessages = async () => {
            try {
                setLoading(true);
                dispatch(setClassroomLoading(true));

                const { data: sessionData } =
                    await supabase.auth.getSession();

                const accessToken =
                    sessionData?.session?.access_token;

                if (!accessToken) {
                    throw new Error("Authentication expired");
                }

                const res = await fetch(
                    `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/direct/get/${chatId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch classroom messages");
                }

                const data: ClassroomBackendMessage[] =
                    await res.json();

                dispatch(
                    setMessages({
                        chat_id: chatId,
                        messages: data,
                    })
                );
            } catch (err) {
                console.error("Error fetching classroom messages", err);
            } finally {
                setLoading(false);
                dispatch(setClassroomLoading(false));
            }
        };

        getMessages();
    }, [chatId, dispatch]);

    return { loading };
}

export default useGetClassroomMessages;
