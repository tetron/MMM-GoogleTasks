import { LogWrapper } from "./utilities/LogWrapper";
import * as Log from "logger";
import * as NodeHelper from "node_helper";
import * as fs from "fs";
import { Auth, google, tasks_v1, Common } from "googleapis";
import { DataConfig, isDataConfig } from "./types/Config";
import { GaxiosError } from "googleapis-common";
import { CredentialsFile } from "./types/Google";
import { ModuleNotification } from "./types/ModuleNotification";
import { GoogleTaskService } from "./backend/GoogleTaskService";

const logger = new LogWrapper("MMM-GoogleTasks", Log);

module.exports = NodeHelper.create({
  taskService: {} as tasks_v1.Tasks,
  oAuth2Client: {} as Auth.GoogleAuth,
  config: {} as DataConfig,
  start: function () {
    logger.log("Starting node helper for: " + this.name);
  },

  socketNotificationReceived: function (notification: string, payload: unknown) {
    if (notification === ModuleNotification.CONFIG) {
      if (isDataConfig(payload)) {
        this.config = payload as DataConfig;
        this.authenticate();
      } else {
        logger.error("Invalid configuration payload");
      }
    } else if (notification === ModuleNotification.RETRIEVE) {
      this.getList(payload);
    }
  },

  authenticate: function () {
    if (fs.existsSync(this.path + "/credentials.json")) {
      const content = fs.readFileSync(this.path + "/credentials.json", "utf-8");
      this.authorize(JSON.parse(content), this.startTasksService);
    } else {
      logger.error("No credentials file found.");
    }
  },
  authorize: function (credentials: CredentialsFile, callback: (auth: Auth.GoogleAuth) => void) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(this.path + "/token.json")) {
      const token = fs.readFileSync(this.path + "/token.json", "utf-8");
      this.oAuth2Client.setCredentials(JSON.parse(token));
      this.taskService = new GoogleTaskService(this.config, logger, this.oAuth2Client);
      if (callback) {
        callback(this.oAuth2Client);
      }
    }
  },

  getList: async function () {
    if (!this.taskService) {
      logger.log("Refresh required");
      return;
    }
    try {
      const payload = await this.taskService.getGoogleTasks();
      if (payload) {
        logger.info(`Sending ${payload.tasks.length} tasks to frontend`);
        this.sendSocketNotification(ModuleNotification.RESULTS, payload);
      } else {
        logger.warn("No payload returned from Google Tasks");
      }
    } catch (e) {
      if ((e as GaxiosError).response) {
        const err = e as Common.GaxiosError;
        logger.error(err.message);
      } else {
        logger.error(`Error retrieving Google Tasks: ${e}`);
      }
    }
  }
});
