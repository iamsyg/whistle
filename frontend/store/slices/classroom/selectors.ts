// frontend/store/slices/classroom/selectors.ts

import { RootState } from "@/store/store";

export const selectSelectedClassroom = (state: RootState) => {
  const id = state.classroom.selectedClassroomId;
  return id ? state.classroom.classrooms[id] : null;
};