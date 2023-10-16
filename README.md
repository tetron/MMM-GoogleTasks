# MMM-GoogleTasks

Module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/) smart mirror.

Displays tasks from Google Tasks App

### Example

![Example of MMM-GoogleTasks](images/sample.png?raw=true "Example screenshot")

### Dependencies

1. The [Google Node.js client library](https://github.com/google/google-api-nodejs-client/): For authentication and Google Tasks API (v1). See Installation for instructions

## Installation

To install the module, use your terminal to:

1. Navigate to your MagicMirror's modules folder. If you are using the default installation directory, use the command:
   `cd ~/MagicMirror/modules`
2. Clone the module:
   `git clone https://github.com/spyder007/MMM-GoogleTasks.git`
3. Run NPM Install to install and transpile:
   `npm install`

If `npm install` causes a heap error during rollup, try `node --max-old-space-size=8192 node_modules/rollup/dist/bin/rollup -c`.

## Authentication Setup

Google Tasks API an authenticated OAuth2 client:

1. Go [here](https://developers.google.com/tasks/quickstart/nodejs), and click "Enable the Google Tasks API" button. Follow the steps to download the credentials.json file.
2. Place the `credentials.json` file in a local directory. It can live alongside your MagicMirror configuration file (`config.js`).
3. [Enable Google Tasks API](https://console.cloud.google.com/apis/library/tasks.googleapis.com). Select the same project as in step 1.
4. Run authenticate.mjs, specifying the location of your credential and token file:
   `node authenticate.mjs -c /path/to/credentials.json -t /path/to/token.json`
5. Follow the instructions to generate tokens. The account name value used when storing tokens in the token.json file. This name is referenced in the `accounts` section of the [configuration](#configuration-options).
6. Repeat steps 4 and 5 for each account you want to authenticate.  Note that every account you want to add must be added to the [Test users](https://console.cloud.google.com/apis/credentials/consent) section for your application.

## Configuration

### MagicMirror² Configuration

To use this module, add the following configuration block to the modules array in the `config/config.js` file:

```js
var config = {
    modules: [
        ...
        {
            module: 'MMM-GoogleTasks',
            header: "Google Tasks",
            position: "top_left",
            config: {
                credentialPath: "/path/to/credentials.json",
                tokenPath: "/path/to/token.json",
                accounts: [

                ]
                ...
                // See below for Configuration Options
            }
        },
        ...
    ]
}
```

### Configuration Options

| Option             | Required | Details                                                                                  | Default                  |
| ------------------ | -------- | ---------------------------------------------------------------------------------------- | ------------------------ |
| `credentialPath`   | Yes      | Path to the `credentials.json` file                                                      |                          |
| `tokenPath`        | Yes      | Path to the `token.json` file                                                            |                          |
| `accounts`         | Yes      | See [Accounts Configuration](#accounts-configuration)                                    |                          |
| `plannedTasks`     | Yes      | See [Planned Task Configuration](#planned-tasks-configuration)                           | `{ enabled: false }`     |
| `maxResults`       | No       | Max number of list items to retrieve.                                                    | 10                       |
| `showCompleted`    | No       | Show completed task items                                                                | `false`                  |
| `maxWidth`         | No       | Width of the table                                                                       | `450px`                  |
| `dateFormat`       | No       | Format to use for due date. [date-fns formats](https://date-fns.org/v2.30.0/docs/format) | `LLL do` (e.g. Jan 18th) |
| `updateInterval`   | No       | Interval at which content updates (Milliseconds)                                         | `10000` (10 seconds)     |
| `animationSpeed`   | No       | Speed of the update animation. (Milliseconds)                                            | `2000` (2 seconds)       |
| `initialLoadDelay` | No       | Delay before first load (Milliseconds)                                                   | `1500` (1.5 seconds)     |
| `ordering`         | No       | The method to order results. `myorder`, `due`, `title`, `updated`                        | `myorder`                |


### Accounts Configuration

The `accounts` section allows you to configure different accounts from which to pull Google tasks. Each account object can have the following properties:

| Option          | Required | Details                                                                                                  | Default |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------- | ------- |
| `name`          | Yes      | The name of the account. There should be a token in your token.json file with the same name.             |         |
| `includedLists` | Yes      | A list of strings or Regex expressions used to determine whether the Google task list should be included |         |

#### Acounts Configuration Example

```js
{
    module: "MMM-GoogleTasks",
    header: "Google Tasks",
    position: "top_right",
    config: {
        credentialPath: "/path/to/credentials.json",
        tokenPath: "/path/to/token.json",
        ordering: "due",
        accounts: [
            {
                name: "work",
                includedLists: ["Inbox"]
            },
            {
                name: "personal",
                includedLists: ["Reminders"]
            }
        ],
        plannedTasks: {
            enable: false
        }
    }
}
```

### Planned Tasks Configuration

You can use the `plannedTasks` configuration section to display upcoming tasks from multiple lists in Google Tasks.

When enabled, make sure the `listName` parameter is not set. Tasks are then retrieved from all lists which match the following criteria:

- Task Status is not equal to `completed`
- Task DueDate is set
- Task Due date is less than the current date + the configured duration.

In other words, if you just enable the Planned Tasks configuration, the default values for `duration` and `includedLists` will take tasks from all lists which are not completed and have a due date less than 2 weeks from today. That will include any tasks that are overdue.

#### Planned Task Configuration Example

```js
{
    module: "MMM-GoogleTasks",
    header: "Google Tasks",
    position: "top_right",
    config: {
        credentialPath: "/path/to/credentials.json",
        tokenPath: "/path/to/token.json",
        ordering: "due",
        plannedTasks: {
            enable: true,
            includedLists: ["Inbox", "Home", "Coding Projects"],
            duration: {
                weeks: 4
            }
        }
    }
}
```

#### `plannedTasks` options

| Option Name   | Type       | Description                                                                                                                                                                                                          | Default Value |
| ------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| enable        | `bool`     |                                                                                                                                                                                                                      | `false`       |
| duration      | `object`   | A duration object, as defined in the [date-fns add](https://date-fns.org/v2.27.0/docs/add) function.                                                                                                                 | `{ weeks: 2}` |
| includedLists | `string[]` | A string list a collection of RegExp patterns. If a list's `displayName` matches one of the [RegEx](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) patterns, it's included | `[ '.*' ]`    |
