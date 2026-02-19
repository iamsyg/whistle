// frontend/store/slices/chat/task/taskDetailSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TaskDetails } from "@/types/chat/task/taskDetails";

interface TaskDetailState {
  tasksById: Record<string, TaskDetails>;  // key = task_id
  taskIds: Record<string, string[]>;  // key = chat_id, value = array of task_ids for that chat
  isTaskDetailLoaded: Record<string, boolean>; // key = chat_id
}

const initialState: TaskDetailState = {
  tasksById: {},
  taskIds: {},
  isTaskDetailLoaded: {},
};

const taskSlice = createSlice({
  name: "task",
  initialState,
    reducers: {

    setAllTasks: (state, action: PayloadAction<{ chatId: string; tasks: TaskDetails[] }>) => {
      const { chatId, tasks } = action.payload;
      state.taskIds[chatId] = tasks.map(task => task.id);
        tasks.forEach(task => {
            state.tasksById[task.id] = task;
        });
        state.isTaskDetailLoaded[chatId] = true;
    },

    upsertTask: (state, action: PayloadAction<TaskDetails>) => {
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
        state.isTaskDetailLoaded[chatId] = false;
    }
    },
});

export const { setAllTasks, upsertTask, removeTask } = taskSlice.actions;

export default taskSlice.reducer;