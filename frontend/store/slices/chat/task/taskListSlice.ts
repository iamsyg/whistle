// frontend/store/slices/chat/task/taskListSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TaskListItem } from "@/types/chat/task/taskListItem";

interface TaskListState {
    taskListsByChatId: Record<string, TaskListItem[]>;  // key = chat_id
    loadedTaskIds: Record<string, boolean>;
}

const initialState: TaskListState = {
    taskListsByChatId: {},
    loadedTaskIds: {},
};
 
const taskListSlice = createSlice({
    name: "taskList",
    initialState,
    reducers: {
        setTaskList: (state, action: PayloadAction<{ chatId: string; tasks: TaskListItem[] }>) => {
            const { chatId, tasks } = action.payload;
            state.taskListsByChatId[chatId] = tasks;
            state.loadedTaskIds[chatId] = true;
        },

        addTaskToList: (state, action: PayloadAction<{ chatId: string; task: TaskListItem }>) => {
            const { chatId, task } = action.payload;
            if (!state.taskListsByChatId[chatId]) {
                state.taskListsByChatId[chatId] = [];
            }
            state.taskListsByChatId[chatId].push(task);
        },

        updateTaskInList: (state, action: PayloadAction<{ chatId: string; task: TaskListItem }>) => {
            const { chatId, task } = action.payload;
            if (state.taskListsByChatId[chatId]) {
                const index = state.taskListsByChatId[chatId].findIndex(t => t.id === task.id);
                if (index !== -1) {
                    state.taskListsByChatId[chatId][index] = task;
                }
            }
        },

        removeTaskFromList: (state, action: PayloadAction<{ chatId: string; taskId: string }>) => {
            const { chatId, taskId } = action.payload;
            if (state.taskListsByChatId[chatId]) {
                state.taskListsByChatId[chatId] = state.taskListsByChatId[chatId].filter(t => t.id !== taskId);
            }

        },

        clearTaskList: (state, action: PayloadAction<string>) => {
            delete state.taskListsByChatId[action.payload];
        },
    },
});

export const { setTaskList, addTaskToList, updateTaskInList, removeTaskFromList, clearTaskList } = taskListSlice.actions;

export default taskListSlice.reducer; 