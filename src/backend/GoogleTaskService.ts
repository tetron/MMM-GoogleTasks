import { DataConfig } from "../types/Config";
import { LogWrapper } from "../utilities/LogWrapper";
import * as Display from "../types/Display";
import { Auth, google, tasks_v1, Common } from "googleapis";
import { GaxiosError } from "googleapis-common";
import { add, formatRFC3339 } from "date-fns";

export class GoogleTaskService {
  taskService: tasks_v1.Tasks;
  pending: boolean = false;
  dataConfig: DataConfig;
  logger: LogWrapper;

  constructor(config: DataConfig, logger: LogWrapper, oAuth2Client: Auth.GoogleAuth) {
    this.dataConfig = config;
    this.logger = logger;
    this.taskService = google.tasks({ version: "v1", auth: oAuth2Client });
  }

  async getGoogleTasks(): Promise<Display.TaskData | undefined> {
    if (this.pending) {
      return;
    }
    this.pending = true;

    if (this.dataConfig.plannedTasks.enable) {
      return this.getPlannedTasks();
    } else {
      return this.getTaskData(this.dataConfig.listID);
    }
  }

  async getTaskData(listId: string): Promise<Display.TaskData | undefined> {
    let showHidden: boolean = false;

    // API requies completed config settings if showCompleted
    if (!this.dataConfig.showCompleted) {
      // delete this.config.completedMin;
      // delete this.config.completedMax;
    } else {
      showHidden = true;
    }

    const tasks = await this.getListTasks(listId, this.dataConfig.maxResults, this.dataConfig.showCompleted, showHidden);
    const taskData = {
      listId: this.dataConfig.listID,
      tasks
    };
    this.pending = false;
    return taskData;
  }

  async getListTasks(listId: string, maxResults: number, showCompleted: boolean, showHidden: boolean, maxDate?: string): Promise<Display.Task[]> {
    const tasks: Display.Task[] = [];

    try {
      const res = await this.taskService.tasks.list({
        tasklist: listId,
        maxResults: maxResults,
        showCompleted: showCompleted,
        showHidden: showHidden,
        dueMax: maxDate
      });
      const listResults: tasks_v1.Schema$Tasks = res.data;

      listResults.items?.forEach((gTask) => {
        tasks.push({
          id: gTask.id ?? "",
          title: gTask.title ?? "No Title",
          parent: gTask.parent ?? undefined,
          position: gTask.position ? parseInt(gTask.position) : -1,
          notes: gTask.notes ?? undefined,
          status: gTask.status ?? undefined,
          due: gTask.due ?? undefined
        });
      });
    } catch (e) {
      if ((e as GaxiosError).response) {
        const err = e as Common.GaxiosError;
        this.logger.error(err.message);
      }
      this.logger.error("Error getting tasks");
    }
    return tasks;
  }

  includeList(listName: string | null | undefined): boolean {
    if (listName === undefined || listName === null) {
      return false;
    }
    if (this.dataConfig.plannedTasks.includedLists.length === 0) {
      return true;
    }
    return this.dataConfig.plannedTasks.includedLists.some((list) => listName.match(list));
  }

  async getPlannedTasks(): Promise<Display.TaskData | undefined> {
    const tasks: Display.Task[] = [];
    const listsResponse = await this.taskService.tasklists.list({ maxResults: 25 });

    const maxDate = formatRFC3339(add(Date.now(), this.dataConfig.plannedTasks.duration));
    this.logger.info(`Max date: ${maxDate}`);

    for (const list of listsResponse.data.items ?? []) {
      this.logger.info(`Checking list ${list.title}`);
      if (this.includeList(list.title) && list.id !== undefined && list.id !== null) {
        this.logger.info(`Including list ${list.title}`);
        const listTasks = await this.getListTasks(list.id as string, 100, false, false, maxDate);
        this.logger.info(`Found ${listTasks.length} tasks`);
        tasks.push(...listTasks);
        this.logger.info(`Total tasks = ${tasks.length}`);
      }
    }

    const taskData = {
      listId: this.dataConfig.listID,
      tasks
    };
    this.pending = false;
    return taskData;
  }

  checkFetchStatus(response: Response) {
    if (response.ok) {
      return response;
    } else {
      throw Error(response.statusText);
    }
  }
}
