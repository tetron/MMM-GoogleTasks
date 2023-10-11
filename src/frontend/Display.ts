import { format, formatDistanceToNowStrict, parseJSON, addDays, isBefore, isAfter } from "date-fns";
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

export const getLoadingView = (config: AppearanceConfig): HTMLElement => {
  const wrapper = document.createElement("div");
  wrapper.className = "wrapper";
  wrapper.style.maxWidth = config.maxWidth ?? "auto";

  wrapper.innerHTML = "Loading Google Tasks";
  wrapper.classList.add("bright", "light", "small");
  return wrapper;
};

const performCustomSort = (originalTasks: Task[]): Task[] => {
  const temp: Task[] = [];
  originalTasks
    .filter((task) => task.parent === undefined) // Filter tasks to only parent tasks
    .sort((a, b) => (a.position > b.position ? 1 : -1)) // Sort parent tasks by position
    .forEach((task) => {
      // Map over parents to create reordered list of tasks
      temp.push(task);

      // Loop through all tasks to find and sort subtasks for each parent
      const subList: Task[] = [];
      originalTasks.map((subtask) => {
        if (subtask.parent === task.id) {
          subList.push(subtask);
        }
      });
      subList.sort((a, b) => (a.position > b.position ? 1 : -1));
      temp.push(...subList);
    });
  return temp;
};

const getOrderedTasks = (originalTasks: Task[], config: AppearanceConfig): Task[] => {
  // Sort attributes like they are shown in the Tasks app
  switch (config.ordering) {
    case "myorder":
      return performCustomSort(originalTasks);

    case "due":
    case "title":
    case "updated":
      return originalTasks.sort((a, b) => {
        const aValue = a[config.ordering as keyof Task] ?? "";
        const bValue = b[config.ordering as keyof Task] ?? "";

        return aValue > bValue ? 1 : -1;
      });
  }
  return originalTasks;
};

const getItemView = (item: Task, config: AppearanceConfig, plannedView: boolean): HTMLElement => {
  const itemWrapper = document.createElement("li");
  itemWrapper.className = "item";
  if (item.due) {
    const dateWrapper = document.createElement("span");
    const classNames = ["date", "light"];
    const dueDate = addDays(parseJSON(item.due), 1);
    const now = new Date();
    const next24 = addDays(now, 1);

    // overdue
    if (isBefore(dueDate, now)) {
      classNames.push("overdue");
    }

    // due in the next day
    if (isBefore(dueDate, next24) && isAfter(dueDate, now)) {
      classNames.push("soon");
    }

    if (isAfter(dueDate, next24)) {
      classNames.push("upcoming");
    }

    console.log(`Due Date: ${dueDate}`);
    if (plannedView) {
      dateWrapper.innerHTML = formatDistanceToNowStrict(dueDate, { addSuffix: true });
    } else {
      dateWrapper.innerHTML = format(dueDate, config.dateFormat);
    }

    dateWrapper.className = classNames.join(" ");
    itemWrapper.appendChild(dateWrapper);
    itemWrapper.innerHTML += " - ";
  }

  itemWrapper.innerHTML += item.title;
  return itemWrapper;
};

export const getTaskView = (taskData: TaskData, config: AppearanceConfig, plannedView: boolean): HTMLElement => {
  const wrapper = document.createElement("ul");
  wrapper.style.maxWidth = config.maxWidth ?? "auto";

  const tasks: Task[] = getOrderedTasks(taskData.tasks, config);

  tasks.forEach((item) => {
    const itemWrapper = getItemView(item, config, plannedView);

    wrapper.appendChild(itemWrapper);
  });

  return wrapper;
};
