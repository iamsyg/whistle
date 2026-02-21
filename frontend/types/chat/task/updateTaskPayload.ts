// frontend/hooks/chat/task/useUpdateTaskDetails.ts

export type UpdateTaskPayload = {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  assignees?: string[]; // array of user_ids
  status?: "pending" | "in_progress" | "completed";
}