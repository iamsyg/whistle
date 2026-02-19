// frontend/hooks/chat/task/useFetchTaskDetails.ts

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { supabase } from "@/utils/supabase";
import { setTask } from "@/store/slices/chat/task/taskDetailSlice";

export function useFetchTaskDetails(task_id: string, chat_id: string) {

    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const loadedTaskIds = useSelector(
        (state: RootState) => state.task.isTaskDetailLoaded[task_id]
    )

    const fetchTaskDetails = async () => {

        if (loadedTaskIds) {
            return;
        }

        setLoading(true);
        try {
            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;

            if (!token) {
                throw new Error("Authentication expired");
            }

            console.log("FETCHING TASK DETAIL:", chat_id, task_id);

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/${chat_id}/task/${task_id}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || "Failed to fetch task Details");
            }

            dispatch(setTask(result));

            console.log("Task details fetched successfully:", result);
        } catch (error) {
            console.error("Error fetching task details:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { fetchTaskDetails, loading };
}
