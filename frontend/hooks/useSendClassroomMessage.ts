// frontend/hooks/useSendClassroomMessage.ts

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  addMessage,
  setConversation,
} from "@/store/slices/message/conversationSlice";
import { supabase } from "@/utils/supabase";
import { setSelectedClassroom } from "@/store/slices/classroom/classroomSlice";

const useSendClassroomMessage = (classroomId: string) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const selectedClassroomId = useSelector(
    (state: RootState) => state.classroom.selectedClassroomId
  );

  useEffect(() => {
    if (classroomId && classroomId !== selectedClassroomId) {
      console.error(`Classroom ID mismatch: expected ${selectedClassroomId}, got ${classroomId}`);
    }
    }, [classroomId, selectedClassroomId]);

  console.log("useSendMessage - selectedConversationId:", selectedClassroomId);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) return;

      let response;
      let message;

      if(!selectedClassroomId) {
        throw new Error("Classroom ID is required to send message");
      }
   
        response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/send/${selectedClassroomId}`,
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
      

        if (!response.ok) throw new Error("Failed to start chat");

        

        // 🔑 IMPORTANT PART
        // dispatch(setConversation({
        //   conversationId: data.chat_id,
        //   type: 'direct',
        //   contactProfileId: receiverId ?? undefined,
        // }))

        console.log("Newly sent message data:", message);
      

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

export default useSendClassroomMessage;
