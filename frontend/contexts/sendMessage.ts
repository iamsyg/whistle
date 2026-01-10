// frontend/contexts/sendMessage.ts

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  addMessage,
  setSelectedConversationId,
} from "@/store/slices/message/conversationSlice";
import { supabase } from "@/utils/supabase";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const selectedConversationId = useSelector(
    (state: RootState) => state.conversation.selectedConversationId
  );

  const receiverId = useSelector(
    (state: RootState) => state.conversation.contactProfileId
  );

  console.log("useSendMessage - selectedConversationId:", selectedConversationId);
  console.log("useSendMessage - receiverId:", receiverId);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) return;

      let response;
      let message;

      /** -------------------------------
       *  CASE 1: chat already exists
       *  ------------------------------*/
      if (selectedConversationId) {
        response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/send/${selectedConversationId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
          }
        );

        console.log("Response from sending message:", response);

        if (!response.ok) throw new Error("Failed to send message");
        message = await response.json();

        console.log("Sent message data:", message);
      }

      /** --------------------------------
       *  CASE 2: chat does NOT exist yet
       *  --------------------------------*/
      else {
        if (!receiverId) {
          throw new Error("receiverId required to start chat");
        }

        console.log("Starting new chat with receiverId:", receiverId);

        response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/direct/send/${receiverId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
          }
        );

        console.log("Response from starting chat and sending message:", response);

        if (!response.ok) throw new Error("Failed to start chat");

        const data = await response.json();

        console.log("Started chat and sent message data:", data);

        // 🔑 IMPORTANT PART
        dispatch(setSelectedConversationId(data.chat_id));
        message = data.message;

        console.log("Newly sent message data:", message);
      }

      // ✅ Single source of truth
      dispatch(addMessage(message));
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendMessage };
};

export default useSendMessage;
