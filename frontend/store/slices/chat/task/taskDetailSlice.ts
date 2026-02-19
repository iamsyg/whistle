// frontend/store/slices/chat/task/taskDetailSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TaskDetails } from "@/types/chat/task/taskDetails";

interface TaskDetailState {
  tasksById: Record<string, TaskDetails>;  // key = task_id
  taskIds: Record<string, string[]>;  // key = chat_id, value = array of task_ids for that chat
  isTaskDetailLoaded: Record<string, boolean>; // key = task_id, value = whether the task details have been loaded for that task  
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

    setTask: (state, action: PayloadAction<TaskDetails>) => {
      const task = action.payload;
      state.tasksById[task.id] = task;
      state.isTaskDetailLoaded[task.id] = true;

      if (!state.taskIds[task.chat_id]) {
        state.taskIds[task.chat_id] = [];
      }

      if (!state.taskIds[task.chat_id].includes(task.id)) {
        state.taskIds[task.chat_id].push(task.id);
      }
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

export const { setTask, upsertTask, removeTask } = taskSlice.actions;

export default taskSlice.reducer;