import { DataConfig } from "../types/Config";
import { LogWrapper } from "../utilities/LogWrapper";
import * as Display from "../types/Display";
import { Auth, google, tasks_v1, Common } from "googleapis";
import { GaxiosError } from "googleapis-common";

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
    }
    else {
      return this.getListTasks(this.dataConfig.listID);
    }
  }

  async getListTasks(listId: string): Promise<Display.TaskData | undefined> {
    let showHidden: boolean = false;

    // API requies completed config settings if showCompleted
    if (!this.dataConfig.showCompleted) {
      // delete this.config.completedMin;
      // delete this.config.completedMax;
    } else {
      showHidden = true;
    }
    try {
      const res = await this.taskService.tasks.list({
        tasklist: listId,
        maxResults: this.dataConfig.maxResults,
        showCompleted: this.dataConfig.showCompleted,
        showHidden: showHidden
      });
      const listResults: tasks_v1.Schema$Tasks = res.data;
      //this.logger.info(JSON.stringify(listResults));

      const tasks: Display.Task[] = [];

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
      const taskData = {
        listId: this.dataConfig.listID,
        tasks
      };
      return taskData;
    } catch (e) {
      if ((e as GaxiosError).response) {
        const err = e as Common.GaxiosError;
        this.logger.error(err.message);
      }
      this.logger.error("Error getting tasks");
    }
    return undefined;
  }

  async getPlannedTasks(): Promise<Display.TaskData | undefined> {
    // TODO: Get All Lists that match the values in `dataConfig.plannedTasks.includedLists`
    

    //  For each of those lists, get tasks up to the duration

    //  return the tasks.

    return undefined;
  }

  checkFetchStatus(response: Response) {
    if (response.ok) {
      return response;
    } else {
      throw Error(response.statusText);
    }
  }
}
