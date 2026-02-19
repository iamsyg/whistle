// frontend/types/chat/task/taskListItem.ts

export type TaskListItem = {
  id: string;
  chat_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: "pending" | "in_progress" | "completed";
  assignees: string[]; // just names
};
