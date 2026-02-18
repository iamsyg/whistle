// frontend/hooks/chat/useCreateTask.ts

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { addMessage } from "@/store/slices/message/conversationSlice";
import { supabase } from "@/utils/supabase";
import { upsertTask } from "@/store/slices/chat/taskSlice";

// export async function useCreateTask(chat_id: string, title: string, assignee_ids: string[], description?: string, due_date?: string, task_status?: 'pending' | 'in_progress' | 'completed') {

//     const [loading, setLoading] = useState(false);
//     const dispatch = useDispatch();

//     const createTask = async () => {

//         setLoading(true);

//         try {
//             const { data } = await supabase.auth.getSession();
//             const token = data?.session?.access_token;
//             if (!token) {
//                 throw new Error("Authentication expired");
//             }

//             const response = await fetch(
//                 `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/task/create/${chat_id}`,
//                 {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json",
//                         Authorization: `Bearer ${token}`,
//                     },
//                     body: JSON.stringify({
//                         title,
//                         assignee_ids,
//                         description,
//                         due_date,
//                         task_status,
//                     }),
//                 }
//             );

//             const result = await response.json();

//             dispatch(upsertTask(result));

//             if (!response.ok) {
//                 console.error("Failed to create task:", result);
//                 throw new Error(result.message || "Failed to create task");
//             }

//             console.log("Task created successfully:", result);

//         } catch (error) {
//             console.error("Error creating task:", error);
//             throw error;
//         } finally {
//             setLoading(false);
//         }
//     }

//     return { createTask, loading };
// }


interface CreateTaskParams {
    title: string;
    assignee_ids: string[];
    description?: string;
    due_date?: string;
    task_status?: 'pending' | 'in_progress' | 'completed';
}


export function useCreateTask(chat_id: string) {

    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const createTask = async ({title, assignee_ids, description, due_date, task_status = "pending"}: CreateTaskParams) => {

        setLoading(true);

        try {
            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;
            if (!token) throw new Error("Authentication expired");

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/task/create/${chat_id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title,
                        assignee_ids,
                        description,
                        due_date,
                        task_status,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || result.message || "Failed to create task");
            }

            // Add message
            dispatch(addMessage(result));

            // Add task entity
            const task = result?.entities?.tasks?.[0];
            if (task) {
                dispatch(upsertTask(task));
            }

            console.log("Task created successfully:", result);
            console.log("Task entity:", task);
            

        } catch (error) {
            console.error("Error creating task:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { createTask, loading };
}
