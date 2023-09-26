import { AppearanceConfig } from "../types/Config";
import { TaskData, Task } from "../types/Display";

// export const getAlertCard = (alert: Alert): HTMLElement => {
//   const card = document.createElement("div");
//   card.classList.add("prom-alert-wrapper");

//   const dateWrapper = document.createElement("div");
//   dateWrapper.classList.add("status-wrapper");
//   card.appendChild(dateWrapper);

//   const dataWrapper = document.createElement("div");
//   dataWrapper.classList.add("data-wrapper");
//   card.appendChild(dataWrapper);

//   // Icon
//   dateWrapper.appendChild(getAlertStatusIcon(alert.state));

//   const title = document.createElement("div");
//   title.classList.add("small", "bright", "no-wrap", "title");
//   title.innerHTML = alert.annotations.summary;
//   dataWrapper.appendChild(title);

//   const startDiv = document.createElement("div");
//   startDiv.classList.add("xsmall", "no-wrap", "dimmed");
//   startDiv.innerText = alert.annotations.description;
//   dataWrapper.appendChild(startDiv);

//   return card;
// };

// export const getAlertStatusIcon = (state: AlertState): HTMLElement => {
//   const icon = document.createElement("i");
//   let iconName = "";
//   switch (state) {
//     case AlertState.PENDING:
//       iconName = "exclamation-triangle";
//       break;
//     case AlertState.FIRING:
//       iconName = "exclamation-circle";
//       break;
//     case AlertState.RESOLVED:
//       iconName = "check";
//       break;
//   }

//   icon.classList.add("fa", "fa-fw", `fa-${iconName}`, `state-${state}`);
//   return icon;
// };

const getWrapperElement = (config: AppearanceConfig): HTMLElement => {
  const wrapper = document.createElement("div");
  wrapper.className = "wrapper";
  wrapper.style.maxWidth = config.maxWidth ?? "auto";

  return wrapper;
};

export const getLoadingView = (config: AppearanceConfig): HTMLElement => {
  const wrapper = getWrapperElement(config);
  wrapper.innerHTML = config.headerText ?? "Google Tasks";
  wrapper.classList.add("bright", "light", "small");
  return wrapper;
};

export const getTaskView = (taskData: TaskData, config: AppearanceConfig): HTMLElement => {
  const wrapper = getWrapperElement(config);

  //  Header
  if (config.useHeader) {
    const header = document.createElement("header");
    header.classList.add("header", "small", "dimmed", "bold");
    const text = document.createElement("span");
    text.innerHTML = config.headerText !== undefined && config.headerText !== "" ? config.headerText : "hi!"; //summary.title;
    header.appendChild(text);
    wrapper.appendChild(header);
  }

  let tasks: Task[] = [];

  // Sort attributes like they are shown in the Tasks app
  switch (config.ordering) {
    case "myorder":
      let temp: Task[] = [];
      taskData.tasks
        .filter((task) => task.parent === undefined) // Filter tasks to only parent tasks
        .sort((a, b) => (a.position > b.position ? 1 : -1)) // Sort parent tasks by position
        .forEach((task) => {
          // Map over parents to create reordered list of tasks
          temp.push(task);

          // Loop through all tasks to find and sort subtasks for each parent
          let subList: Task[] = [];
          taskData.tasks.map((subtask) => {
            if (subtask.parent === task.id) {
              subList.push(subtask);
            }
          });
          subList.sort((a, b) => (a.position > b.position ? 1 : -1));
          temp.push(...subList);
        });
      tasks = temp;
      break;

    // case "due":
    // case "title":
    // case "updated":
    //   this.tasks = this.tasks.sort((a, b) => (a[this.config.ordering] > b[this.config.ordering] ? 1 : -1));
    //   break;
  }

  let titleWrapper, dateWrapper, noteWrapper;

  tasks.forEach((item, index) => {
    titleWrapper = document.createElement("div");
    titleWrapper.className = "item title";
    titleWrapper.innerHTML = '<i class="fa fa-circle-thin" ></i>' + item.title;

    // If item is completed change icon to checkmark
    if (item.status === "completed") {
      titleWrapper.innerHTML = '<i class="fa fa-check" ></i>' + item.title;
    }

    if (item.parent) {
      titleWrapper.className = "item child";
    }

    if (item.notes) {
      noteWrapper = document.createElement("div");
      noteWrapper.className = "item notes light";
      noteWrapper.innerHTML = item.notes.replace(/\n/g, "<br>");
      titleWrapper.appendChild(noteWrapper);
    }

    dateWrapper = document.createElement("div");
    dateWrapper.className = "item date light";

    if (item.due) {
      //let date = moment(item.due);
      //dateWrapper.innerHTML = date.utc().format(config.dateFormat);
      dateWrapper.innerHTML = item.due
    }

    // Create borders between parent items
    if (index < tasks.length - 1 && !tasks[index + 1].parent) {
      titleWrapper.style.borderBottom = "1px solid #666";
      dateWrapper.style.borderBottom = "1px solid #666";
    }

    wrapper.appendChild(titleWrapper);
    wrapper.appendChild(dateWrapper);
  });

  return wrapper;
};
