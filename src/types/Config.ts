import { Duration } from "date-fns";

export interface PlannedTaskConfig {
  enable: boolean;
  includedLists: string[];
  duration: Duration;
}

export interface DataConfig {
  listID: string;
  showCompleted: boolean;
  maxResults: number;
  plannedTasks: PlannedTaskConfig;
}

export const isDataConfig = (obj: unknown): boolean => {
  if (typeof obj === "object" && obj) {
    return "listID" in obj && "ordering" in obj && "showCompleted" in obj;
  }
  return false;
};

export interface AppearanceConfig {
  dateFormat: string;
  updateInterval?: number;
  animationSpeed?: number;
  initialLoadDelay?: number;
  maxWidth?: string;
  ordering: string;
}

export interface Config extends DataConfig, AppearanceConfig {}
