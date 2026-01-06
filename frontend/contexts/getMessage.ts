// frontend/contexts/getMessage.ts

import React, { useEffect, useState } from "react";
// import useConversation from "../statemanage/useConversation.js";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setMessages } from "@/store/slices/message/conversationSlice";

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

                const res = await fetch(
                    `${process.env.EXPO_PUBLIC_BACKEND_URL}/direct/${selectedConversationId}`
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