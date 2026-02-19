// frontend/hooks/chat/task/useFetchTasks.ts

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setTaskList } from "@/store/slices/chat/task/taskListSlice";
import { supabase } from "@/utils/supabase";

export function useFetchTasks(chat_id: string) {

    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const loadedTaskIds = useSelector(
        (state: RootState) => state.taskList.loadedTaskIds[chat_id]
    )

    const fetchTasks = async () => {

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

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/${chat_id}/tasks`,
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
                console.error("Failed to fetch tasks:", result);
                throw new Error(result.message || "Failed to fetch tasks");
            }

            dispatch(setTaskList({ chatId: chat_id, tasks: result }));

            console.log("Tasks fetched successfully:", result);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (chat_id) {
            fetchTasks();
        }
    }, [chat_id]);

    return { loading };
}