export type TaskData = {
  listId: string;
  tasks: Task[];
};

export type Task = {
  id: string;
  title: string;
  parent?: string;
  position: number;
  notes?: string;
  status?: string;
  due?: string;
};
