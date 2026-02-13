// frontend/hooks/useGetMessage.ts

import React, { useEffect, useState } from "react";
// import useConversation from "../statemanage/useConversation.js";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setMessages } from "@/store/slices/message/conversationSlice";
import { supabase } from "@/utils/supabase";
import { BackendMessage } from "@/types/backend/message";

interface MessageState {
    loading: boolean;
    messages: BackendMessage[];
}

function useGetMessage(chatId: string | null): MessageState {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    // const selectedConversationId = useSelector(
    //     (state: RootState) => state.conversation.selectedConversationId
    // );

    useEffect(() => {
        if (!chatId) return;
    }, [chatId]);

    const messages = useSelector(
        (state: RootState) => state.conversation.chatMessages[chatId ?? ''] || []
    );

    useEffect(() => {

        if (!chatId) return;

        const getMessages = async () => {

            try {
                setLoading(true);
                const { data: sessionData } = await supabase.auth.getSession();
                const accessToken = sessionData?.session?.access_token;

                if (!accessToken) {
                    console.log("No access token found: /frontend/contexts/getMessage.ts");
                    setLoading(false);
                    return;
                }

                const res = await fetch(
                    `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/direct/get/${chatId}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    }
                }
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch messages: /chat/direct/get/{} not working");
                }

                const data: BackendMessage[] = await res.json();

                dispatch(setMessages({
                    chat_id: chatId,
                    messages: data
                }));
            } catch (error) {
                console.log("Error in getting messages", error);
                setLoading(false);
            } finally {
                setLoading(false);
            }
        };
        getMessages();
    }, [chatId, dispatch]);
    return { loading, messages };
};

export default useGetMessage;