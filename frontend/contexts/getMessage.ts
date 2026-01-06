// frontend/contexts/getMessage.ts

import React, { useEffect, useState } from "react";
// import useConversation from "../statemanage/useConversation.js";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setMessages } from "@/store/slices/message/conversationSlice";
import { supabase } from "@/utils/supabase";

const useGetMessage = () => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const selectedConversationId = useSelector(
        (state: RootState) => state.conversation.selectedConversationId
    );


    const messages = useSelector(
        (state: RootState) => state.conversation.messages
    );


    useEffect(() => {

        if (!selectedConversationId) return;

        const getMessages = async () => {

            try {

                setLoading(true);
                const { data: sessionData } = await supabase.auth.getSession();
                const accessToken = sessionData?.session?.access_token;

                const res = await fetch(
                    `${process.env.EXPO_PUBLIC_BACKEND_URL}/direct/send/${selectedConversationId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    }
                }

                );

                const data = await res.json();

                dispatch(setMessages(data));
                setLoading(false);
            } catch (error) {
                console.log("Error in getting messages", error);
                setLoading(false);
            }
        };
        getMessages();
    }, [selectedConversationId, dispatch]);
    return { loading, messages };
};

export default useGetMessage;