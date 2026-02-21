// frontend/hooks/chat/task/useUpdateTaskDetails.ts

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { supabase } from "@/utils/supabase";
import { UpdateTaskPayload } from "@/types/chat/task/updateTaskPayload";

export function useUpdateTaskDetails(task_id: string, chat_id: string) {

    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const updateTaskDetails = async (updateData: UpdateTaskPayload)  => {

        setLoading(true);

        try {
            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;
            if (!token) {
                throw new Error("Authentication expired");
            }

            console.log("UPDATING TASK DETAIL:", chat_id, task_id, updateData);

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/${chat_id}/task/${task_id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(updateData),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                console.log("Failed to update task details:", result);
                throw new Error(result.detail || "Failed to update task details");
            }

            console.log("Task details updated successfully:", result);

            return result;
        } catch (error) {
            console.error("Error updating task details:", error);
            throw error;
        } finally {
            setLoading(false);
        }

    };

    return { updateTaskDetails, loading };
}
