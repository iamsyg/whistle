// frontend/types/chat/task.ts

export type Task = {
  
  id: string,
  chat_id: string,
  message_id: string,
  title: string,

  description: string | null,
  created_by: string,
  due_date: string | null,

  status: "pending" | "in_progress" | "completed",
  created_at: string,
  updated_at: string,

  creator: {
      id: string,
      name: string | null,
      username: string | null,
      avatar_url: string | null,
  }

  assignees?: Assignees[];
};

export type Assignees = {

  // id: string,
  // name: string,
  // username: string | null,
  // avatar_url: string | null,

  user_id: string;
  status: "pending" | "in_progress" | "completed";
  assigned_at: string;

  name: string | null;
  username: string | null;
  avatar_url: string | null;
};