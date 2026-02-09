// frontend/hooks/classroom/messages/useSendClassroomMessage.ts

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { addMessage } from "@/store/slices/classroom/classroomSlice";
import { supabase } from "@/utils/supabase";

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

  console.log("useSendClassroomMessage - selectedClassroomId:", selectedClassroomId);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      if (!token) {
        throw new Error("Authentication expired");
      }

      let response;
      let message;

      if (!selectedClassroomId) {
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

      if (!response.ok) throw new Error("Failed to send message");
      message = await response.json();

      console.log("useSendClassroomMessage: message: ", message);

      dispatch(addMessage({
        chat_id: selectedClassroomId, // or classroomId
        message: message,             // the message object returned from backend
      }));

    } catch (error) {
      console.error("useSendClassroomMessage: Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendMessage };
};

export default useSendClassroomMessage;
