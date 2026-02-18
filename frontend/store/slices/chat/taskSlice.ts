// frontend/store/slices/chat/taskSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Task } from "@/types/chat/task";

interface TaskState {
  tasksById: Record<string, Task>;  // key = task_id
  taskIds: Record<string, string[]>;  // key = chat_id, value = array of task_ids for that chat
}

const initialState: TaskState = {
  tasksById: {},
  taskIds: {},
};

const taskSlice = createSlice({
  name: "task",
  initialState,
    reducers: {

    setAllTasks: (state, action: PayloadAction<{ chatId: string; tasks: Task[] }>) => {
      const { chatId, tasks } = action.payload;
      state.taskIds[chatId] = tasks.map(task => task.id);
        tasks.forEach(task => {
            state.tasksById[task.id] = task;
        });
    },

    upsertTask: (state, action: PayloadAction<Task>) => {
      const task = action.payload;
      state.tasksById[task.id] = task;
        if (!state.taskIds[task.chat_id]) {
            state.taskIds[task.chat_id] = [];
        }
        if (!state.taskIds[task.chat_id].includes(task.id)) {
            state.taskIds[task.chat_id].push(task.id);
        }
    },

    removeTask: (state, action: PayloadAction<{ taskId: string; chatId: string }>) => {
        const { taskId, chatId } = action.payload;
        delete state.tasksById[taskId];
        
        state.taskIds[chatId] = state.taskIds[chatId].filter(id => id !== taskId);
        
    }
    },
});

export const { setAllTasks, upsertTask, removeTask } = taskSlice.actions;

export default taskSlice.reducer;