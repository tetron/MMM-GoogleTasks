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
2. Move credentials.json to your MMM-GoogleTasks directory (MagicMirror/modules/MMM-GoogleTasks/)
3. [Enable Google Tasks API](https://console.cloud.google.com/apis/library/tasks.googleapis.com). Select the same project as in step 1.
4. Run authenticate.js:
   `node authenticate.mjs`
5. Follow the instructions and it should print your lists. Copy the ID of the list you want to the config listID

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
                listID: "",
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
| `listID`           | Yes      | List ID printed from authenticate.mjs (see installation)                                 |                          |
| `maxResults`       | No       | Max number of list items to retrieve.                                                    | 10                       |
| `showCompleted`    | No       | Show completed task items                                                                | `false`                  |
| `maxWidth`         | No       | Width of the table                                                                       | `450px`                  |
| `dateFormat`       | No       | Format to use for due date. [date-fns formats](https://date-fns.org/v2.30.0/docs/format) | `LLL do` (e.g. Jan 18th) |
| `updateInterval`   | No       | Interval at which content updates (Milliseconds)                                         | `10000` (10 seconds)     |
| `animationSpeed`   | No       | Speed of the update animation. (Milliseconds)                                            | `2000` (2 seconds)       |
| `initialLoadDelay` | No       | Delay before first load (Milliseconds)                                                   | `1500` (1.5 seconds)     |
| `ordering`         | No       | The method to order results. `myorder`, `due`, `title`, `updated`                        | `myorder`                |
| `plannedTasks`     | Yes      | See [Planned Task Configuration](#planned-tasks-configuration)                           | `{ enabled: false }`     |

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
        listID: "MTc0NDU5MjE5OTkwMzc4MTE4NjU6NDcyMjk5MTIwOjA",
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
