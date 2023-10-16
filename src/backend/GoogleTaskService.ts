import { AccountConfig, DataConfig } from "../types/Config";
import { AccountToken, Token } from "../types/Authentication";
import { LogWrapper } from "../utilities/LogWrapper";
import * as Display from "../types/Display";
import { Auth, google, tasks_v1, Common } from "googleapis";
import { GaxiosError } from "googleapis-common";
import { add, formatRFC3339 } from "date-fns";
import { tasks } from "googleapis/build/src/apis/tasks";

export class GoogleTaskService {
  taskService: tasks_v1.Tasks;
  oAuthClient: Auth.GoogleAuth;
  pending: boolean = false;
  dataConfig: DataConfig;
  logger: LogWrapper;
  accountTokens: AccountToken[];

  constructor(config: DataConfig, logger: LogWrapper, oAuth2Client: Auth.GoogleAuth, accountTokens: AccountToken[]) {
    this.dataConfig = config;
    this.logger = logger;
    this.accountTokens = accountTokens;
    this.oAuthClient = oAuth2Client;
    this.taskService = google.tasks({ version: "v1", auth: oAuth2Client });
  }

  async getGoogleTasks(): Promise<Display.TaskData | undefined> {
    if (this.pending) {
      return;
    }
    this.pending = true;

    return this.getTasksForAllAccounts(this.dataConfig.plannedTasks.enable);
  }

  async getListTasks(accountConfig: AccountConfig, listId: string, maxResults: number, showCompleted: boolean, showHidden: boolean, maxDate?: string): Promise<Display.Task[]> {
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
          account: accountConfig.name,
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

  includeList(listName: string | null | undefined, accountConfig: AccountConfig): boolean {
    if (listName === undefined || listName === null) {
      return false;
    }
    if (accountConfig.includedLists.length === 0) {
      return true;
    }
    return accountConfig.includedLists.some((list) => listName.match(list));
  }

  setAccountCredentials(token: Token): void {
    // @ts-ignore
    this.oAuthClient.setCredentials(token);
    this.taskService = google.tasks({ version: "v1", auth: this.oAuthClient });
  }

  async getTasksForAllAccounts(planned: boolean): Promise<Display.TaskData | undefined> {
    let tasks: Display.Task[] = [];
    for (const configAccount of this.dataConfig.accounts) {
      const accountToken = this.accountTokens.find((element) => element.account === configAccount.name);
      if (accountToken) {
        this.setAccountCredentials(accountToken.token);
        const accountTasks = await this.getAccountTasks(configAccount, planned);
        if (accountTasks) {
          tasks.push(...accountTasks);
        }
      } else {
        this.logger.error(`No token found for account ${configAccount.name}`);
      }
    }

    const taskData = {
      tasks
    };
    this.pending = false;
    return taskData;
  }

  async getAccountTasks(accountConfig: AccountConfig, planned: boolean): Promise<Display.Task[] | undefined> {
    const tasks: Display.Task[] = [];
    const listsResponse = await this.taskService.tasklists.list({ maxResults: 25 });

    const maxDate = formatRFC3339(add(Date.now(), this.dataConfig.plannedTasks.duration));
    this.logger.info(`Max date: ${maxDate}`);

    for (const list of listsResponse.data.items ?? []) {
      this.logger.info(`Checking list ${list.title}`);
      if (this.includeList(list.title, accountConfig) && list.id !== undefined && list.id !== null) {
        this.logger.info(`Including list ${list.title}`);
        const listTasks = await this.getListTasks(accountConfig, list.id as string, planned ? 100 : this.dataConfig.maxResults, planned ? this.dataConfig.showCompleted : false, false, planned ? maxDate : undefined);
        this.logger.info(`Found ${listTasks.length} tasks`);
        tasks.push(...listTasks);
        this.logger.info(`Total tasks = ${tasks.length}`);
      }
    }

    return tasks;
  }

  checkFetchStatus(response: Response) {
    if (response.ok) {
      return response;
    } else {
      throw Error(response.statusText);
    }
  }
}
