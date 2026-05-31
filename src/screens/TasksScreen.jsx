import { useCallback, useEffect, useMemo, useState } from "react";
import CardSurface from "../components/ui/CardSurface";
import PriorityBadge from "../components/ui/PriorityBadge";
import ProgressBar from "../components/ui/ProgressBar";
import { tasks as demoTasks } from "../data/mockData";
import { MOCK_USER_ID, isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86400000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const NORMALIZED_WEEKDAYS = WEEKDAYS.map((day) => day.toLowerCase());
const PRIORITY_RANK = { HIGH: 0, MED: 1, MEDIUM: 1, LOW: 2 };
const STATUS_RANK = { "in-progress": 0, todo: 1, done: 2 };
const STATUS_TO_COLUMN = { todo: "todo", "in-progress": "wip", done: "done" };
const SMOKE_TEST_TASK_PATTERNS = [/smoke/i, /task-1 testing-1/i, /manual smoke test/i];

function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "No date";
  return MONTHS[d.getMonth()] + " " + d.getDate();
}

function isSmokeTestTask(task) {
  return SMOKE_TEST_TASK_PATTERNS.some((pattern) => pattern.test(task.title || ""));
}

function productionTasks(taskList) {
  return taskList.filter((task) => !isSmokeTestTask(task));
}

function buildDemoTasks() {
  return productionTasks(demoTasks).map((task, index) => ({
    ...task,
    id: `demo-${task.id}`,
    created_at: new Date(Date.now() - index * 60000).toISOString(),
  }));
}

function dueDateClass(iso) {
  const dueDate = new Date(iso);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diff = Math.ceil((dueDate - today) / DAY_MS);
  if (Number.isNaN(diff)) return "text-on-surface-variant";
  if (diff <= 0) return "text-error";
  if (diff <= 3) return "text-primary";
  return "text-on-surface-variant";
}

function isoFromDueLabel(task, index) {
  const dueLabel = task.due_label || task.dueLabel;
  const normalizedLabel = dueLabel?.toLowerCase();
  const date = new Date();

  if (normalizedLabel === "today") {
    date.setDate(date.getDate());
  } else if (normalizedLabel === "tomorrow") {
    date.setDate(date.getDate() + 1);
  } else if (normalizedLabel === "yesterday") {
    date.setDate(date.getDate() - 1);
  } else if (normalizedLabel === "next week") {
    date.setDate(date.getDate() + 7);
  } else if (NORMALIZED_WEEKDAYS.includes(normalizedLabel)) {
    const targetDay = NORMALIZED_WEEKDAYS.findIndex((day) => day === normalizedLabel);
    const daysUntilTarget = (targetDay - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + daysUntilTarget);
  } else {
    date.setDate(date.getDate() + index + 1);
  }

  return date.toISOString();
}

function taskStatus(task, index) {
  if (task.done || task.column === "done") return "done";
  if (task.column === "wip" || task.column === "in-progress") return "in-progress";
  if (task.column === "todo") return "todo";
  if (task.status) return task.status;
  if (index === 1) return "in-progress";
  return "todo";
}

function normalizedTask(task, index) {
  const dueLabel = task.due_label || task.dueLabel;
  const timeLabel = task.time_label || task.timeLabel;
  const dueDate = task.dueDate || task.due || isoFromDueLabel(task, index);
  const done = Boolean(task.done || task.column === "done");
  const status = taskStatus({ ...task, done }, index);

  return {
    ...task,
    done,
    dueLabel,
    timeLabel,
    category: task.project || task.category || [dueLabel, timeLabel].filter(Boolean).join(" / ") || "Operations",
    dueDate,
    progress: task.progress ?? (status === "in-progress" ? 62 : 0),
    status,
  };
}

function compareTasks(a, b) {
  const statusDiff = (STATUS_RANK[a.status] ?? 3) - (STATUS_RANK[b.status] ?? 3);
  if (statusDiff !== 0) return statusDiff;

  const dueDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  if (!Number.isNaN(dueDiff) && dueDiff !== 0) return dueDiff;

  const priorityDiff = (PRIORITY_RANK[priorityLabel(a.priority)] ?? 3) - (PRIORITY_RANK[priorityLabel(b.priority)] ?? 3);
  if (priorityDiff !== 0) return priorityDiff;

  return a.title.localeCompare(b.title);
}

const priorityClasses = {
  HIGH: "[&>span]:bg-error/15 [&>span]:text-error [&>span]:border-error/30",
  MED: "[&>span]:bg-primary/15 [&>span]:text-primary [&>span]:border-primary/30",
  MEDIUM: "[&>span]:bg-primary/15 [&>span]:text-primary [&>span]:border-primary/30",
  LOW: "[&>span]:bg-white/10 [&>span]:text-on-surface [&>span]:border-white/20",
};

function priorityLabel(priority) {
  if (priority === "Medium") return "MED";
  return String(priority || "Low").toUpperCase();
}

function priorityClass(priority) {
  return priorityClasses[priorityLabel(priority)] || priorityClasses.LOW;
}

function StitchPriorityBadge({ priority }) {
  return (
    <span className={`[&>span]:inline-block [&>span]:px-2 [&>span]:py-1 [&>span]:rounded [&>span]:font-label-caps [&>span]:text-[10px] [&>span]:border ${priorityClass(priority)}`}>
      <PriorityBadge priority={priorityLabel(priority)} />
    </span>
  );
}

function ToggleButton({ active, children, onClick }) {
  return (
    <button
      className={`px-4 py-2 rounded-md font-label-caps ${
        active ? "bg-[#353534] text-on-surface" : "text-on-surface-variant"
      }`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function KanbanCard({ error, task, state, onDragStart, onMove, saving }) {
  const inProgress = state === "in-progress";
  const done = state === "done";
  const actions = [
    { label: "Todo", column: "todo", status: "todo" },
    { label: "WIP", column: "wip", status: "in-progress" },
    { label: "Done", column: "done", status: "done" },
  ].filter((action) => action.status !== task.status);

  return (
    <CardSurface
      className={`surface-card p-4 transition-transform ${
        inProgress ? "border-primary/30" : ""
      } ${done ? "bg-surface-container-highest/50" : ""} ${
        saving ? "opacity-70" : "cursor-grab hover:-translate-y-1 active:cursor-grabbing"
      }`}
      draggable={!saving}
      onDragStart={(event) => onDragStart(event, task)}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <StitchPriorityBadge priority={task.priority} />
        <span
          className={`material-symbols-outlined text-[16px] ${
            inProgress
              ? "text-primary"
              : done
                ? "text-secondary"
                : "text-on-surface-variant"
          }`}
        >
          {inProgress ? "sync" : done ? "check_circle" : "more_horiz"}
        </span>
      </div>

      <h4 className={`font-body-sm text-on-surface mb-4 ${done ? "line-through" : ""}`}>
        {task.title}
      </h4>

      <div className="mt-auto">
        <p className="font-data-md text-[11px] text-on-surface-variant">{fmtDate(task.dueDate)}</p>
        {inProgress ? (
          <div className="mt-3 [&>div]:bg-[#2A2A2A] [&>div]:h-1 [&>div]:rounded-full [&>div]:overflow-hidden [&>div>div]:bg-primary [&>div>div]:h-full">
            <ProgressBar value={task.progress} />
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              className="rounded border border-white/10 px-2 py-1 font-label-caps text-[10px] text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
              disabled={saving}
              key={action.column}
              onClick={() => onMove(task, action.column)}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
        {error ? (
          <p className="mt-3 font-body-sm text-[12px] text-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </CardSurface>
  );
}

function KanbanColumn({ label, state, items, onDragStart, onDropTask, onMove, rowErrors, savingTaskIds }) {
  const isInProgress = state === "in-progress";
  const isDone = state === "done";

  return (
    <div className={`flex-1 min-w-[200px] ${isDone ? "opacity-50" : ""}`}>
      <div
        className={`flex items-center justify-between pb-2 mb-4 border-b ${
          isInProgress
            ? "border-primary/50"
            : isDone
              ? "border-secondary/30"
              : "border-white/20"
        }`}
      >
        <h3
          className={`font-label-caps ${
            isInProgress ? "text-primary" : "text-on-surface-variant"
          }`}
        >
          {label}
        </h3>
        <span
          className={`px-2 py-1 rounded border font-data-md text-[11px] ${
            isInProgress
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-[#2A2A2A] border-white/10 text-on-surface-variant"
          }`}
        >
          {items.length}
        </span>
      </div>

      <div
        className="flex min-h-[220px] flex-col gap-4 rounded-lg"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => onDropTask(event, state)}
      >
        {items.length ? (
          items.map((task) => (
            <KanbanCard
              error={rowErrors[task.id]}
              key={task.id}
              onDragStart={onDragStart}
              onMove={onMove}
              saving={savingTaskIds.has(task.id)}
              state={state}
              task={task}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center font-body-sm text-body-sm text-on-surface-variant">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-6">
      {[0, 1, 2, 3].map((item) => (
        <div className="h-14 animate-pulse rounded-lg bg-white/10" key={item} />
      ))}
    </div>
  );
}

export default function TasksScreen() {
  const [view, setView] = useState("list");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadNotice, setLoadNotice] = useState(null);
  const [formError, setFormError] = useState("");
  const [rowErrors, setRowErrors] = useState({});
  const [dataSource, setDataSource] = useState("live");
  const [savingTaskIds, setSavingTaskIds] = useState(() => new Set());
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [form, setForm] = useState({
    title: "",
    project: "",
    due_label: "Today",
    time_label: "",
    priority: "Medium",
    column: "todo",
    estimate: "",
  });

  const useDemoTasks = useCallback((notice) => {
    setTasks(buildDemoTasks());
    setDataSource("demo");
    setLoadNotice(notice);
    setLoading(false);
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setLoadNotice(null);

    if (!isSupabaseConfigured) {
      useDemoTasks("Live sync is not configured. Showing demo tasks.");
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", MOCK_USER_ID)
        .order("created_at", { ascending: false });

      if (fetchError) {
        useDemoTasks("Live sync is unavailable. Showing demo tasks.");
        return;
      }

      setTasks(productionTasks(data || []));
      setDataSource("live");
      setLoading(false);
    } catch (fetchError) {
      useDemoTasks("Live sync is unavailable. Showing demo tasks.");
    }
  }, [useDemoTasks]);

  const saveTaskLocally = useCallback((task, notice) => {
    setTasks((currentTasks) => productionTasks([task, ...currentTasks]));
    setDataSource("local");
    setLoadNotice(notice);
  }, []);

  const clearSavingTask = useCallback((taskId) => {
    setSavingTaskIds((current) => {
      const nextIds = new Set(current);
      nextIds.delete(taskId);
      return nextIds;
    });
  }, []);

  const saveUpdateLocally = useCallback((taskId, message) => {
    setDataSource("local");
    setLoadNotice("Live sync is unavailable. Changes are saved locally for this demo session.");
    setRowErrors((current) => ({ ...current, [taskId]: message }));
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const rosterTasks = useMemo(() => tasks.map(normalizedTask).sort(compareTasks), [tasks]);
  const kanbanTasks = rosterTasks;

  const todoTasks = kanbanTasks.filter((task) => task.status === "todo");
  const inProgressTasks = kanbanTasks.filter((task) => task.status === "in-progress");
  const completedTasks = kanbanTasks.filter((task) => task.status === "done");

  const aiSuggestion = useMemo(() => {
    const openTasks = rosterTasks.filter((task) => task.status !== "done");
    const suggestedTask = openTasks[0];

    if (!suggestedTask) {
      return {
        title: "Review completed work",
        detail: "No open tasks. Use the next planning block to reset priorities.",
        window: "Next planning block",
      };
    }

    const urgent = dueDateClass(suggestedTask.dueDate) === "text-error";
    const dueLabel = fmtDate(suggestedTask.dueDate);

    return {
      title: suggestedTask.title,
      detail: `${priorityLabel(suggestedTask.priority)} priority${urgent ? ", overdue or due today" : ""}. Start here before lower-priority work.`,
      window: `${dueLabel}${suggestedTask.timeLabel ? " at " + suggestedTask.timeLabel : ""}`,
    };
  }, [rosterTasks]);

  function updateForm(field, value) {
    setFormError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleAddTask(event) {
    event.preventDefault();

    const title = form.title.trim();

    if (!title || isAddingTask) return;

    setIsAddingTask(true);
    setFormError("");

    const newTask = {
      id: `local-${Date.now()}`,
      user_id: MOCK_USER_ID,
      title,
      project: form.project.trim() || null,
      due_label: form.due_label.trim() || null,
      time_label: form.time_label.trim() || null,
      priority: form.priority,
      column: form.column,
      done: form.column === "done",
      estimate: form.estimate.trim() || null,
      created_at: new Date().toISOString(),
    };

    try {
      if (dataSource !== "live" || !isSupabaseConfigured) {
        saveTaskLocally(newTask, "Task saved locally for this demo session.");
        resetForm();
        return;
      }

      const { error: insertError } = await supabase.from("tasks").insert({
        user_id: newTask.user_id,
        title: newTask.title,
        project: newTask.project,
        due_label: newTask.due_label,
        time_label: newTask.time_label,
        priority: newTask.priority,
        column: newTask.column,
        done: newTask.done,
        estimate: newTask.estimate,
      });

      if (insertError) {
        saveTaskLocally(newTask, "Live sync is unavailable. Task saved locally for this demo session.");
        setFormError("Live sync failed. Task saved locally for the demo.");
        resetForm();
        return;
      }

      resetForm();
      await fetchTasks();
    } catch (submitError) {
      saveTaskLocally(newTask, "Live sync is unavailable. Task saved locally for this demo session.");
      setFormError("Live sync failed. Task saved locally for the demo.");
      resetForm();
    } finally {
      setLoading(false);
      setIsAddingTask(false);
    }
  }

  function resetForm() {
    setForm({
      title: "",
      project: "",
      due_label: "Today",
      time_label: "",
      priority: "Medium",
      column: "todo",
      estimate: "",
    });
  }

  async function updateTask(task, updates) {
    if (savingTaskIds.has(task.id)) return;

    setRowErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[task.id];
      return nextErrors;
    });
    setSavingTaskIds((current) => new Set(current).add(task.id));
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id
          ? { ...currentTask, ...updates }
          : currentTask,
      ),
    );

    if (dataSource !== "live" || !isSupabaseConfigured) {
      clearSavingTask(task.id);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", task.id)
        .eq("user_id", MOCK_USER_ID);

      if (updateError) {
        saveUpdateLocally(task.id, "Live sync failed. Change saved locally for the demo.");
        return;
      }

      fetchTasks();
    } catch (updateError) {
      saveUpdateLocally(task.id, "Live sync failed. Change saved locally for the demo.");
    } finally {
      clearSavingTask(task.id);
    }
  }

  function toggleDone(task) {
    const nextDone = !task.done;
    const nextColumn = nextDone
      ? "done"
      : task.column === "done" || task.status === "done"
        ? "todo"
        : task.column || STATUS_TO_COLUMN[task.status] || "todo";
    updateTask(task, { done: nextDone, column: nextColumn });
  }

  function moveTask(task, column) {
    updateTask(task, { column, done: column === "done" });
  }

  function handleDragStart(event, task) {
    event.dataTransfer.setData("text/plain", task.id);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDropTask(event, status) {
    event.preventDefault();

    const taskId = event.dataTransfer.getData("text/plain");
    const task = rosterTasks.find((currentTask) => currentTask.id === taskId);
    const column = STATUS_TO_COLUMN[status];

    if (!task || !column || task.status === status) return;

    moveTask(task, column);
  }

  function generateAiPlan() {
    const openTasks = rosterTasks.filter((task) => task.status !== "done");
    const focusTasks = openTasks.slice(0, 3);
    const highPriorityCount = openTasks.filter((task) => priorityLabel(task.priority) === "HIGH").length;

    setAiPlan({
      focusTasks,
      summary: focusTasks.length
        ? `Focus on ${focusTasks[0].title} first, then batch ${Math.max(openTasks.length - 1, 0)} remaining open task${openTasks.length === 2 ? "" : "s"}.`
        : "No open tasks. Use the next block for review and planning.",
      risk: highPriorityCount
        ? `${highPriorityCount} high-priority task${highPriorityCount === 1 ? "" : "s"} need attention before lower-priority work.`
        : "No high-priority blockers detected.",
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-margin-desktop flex flex-col gap-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Task Execution</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Prioritize today&apos;s initiatives and monitor workflow movement.
          </p>
        </div>

        <div className="bg-[#1A1A1A] p-1 rounded-lg border border-white/20">
          <ToggleButton active={view === "list"} onClick={() => setView("list")}>
            LIST
          </ToggleButton>
          <ToggleButton active={view === "kanban"} onClick={() => setView("kanban")}>
            KANBAN
          </ToggleButton>
        </div>
      </section>

      <CardSurface className="surface-card bg-[#1A1A1A] border border-white/20 rounded-xl p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-label-caps text-label-caps text-primary">AI TASK COACH</p>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Today&apos;s Execution Plan
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Generates a demo-ready plan from priority, due date, and workflow state.
            </p>
          </div>
          <button
            className="rounded bg-primary-container px-4 py-3 font-label-caps text-label-caps text-on-primary-container transition-opacity hover:opacity-90"
            onClick={generateAiPlan}
            type="button"
          >
            AI PLAN MY DAY
          </button>
        </div>
        {aiPlan ? (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-[#0D0D0D] p-4">
              <p className="font-label-caps text-label-caps text-on-surface-variant">NEXT MOVE</p>
              <p className="mt-2 font-body-sm text-body-sm text-on-surface">{aiPlan.summary}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0D0D0D] p-4">
              <p className="font-label-caps text-label-caps text-on-surface-variant">RISK</p>
              <p className="mt-2 font-body-sm text-body-sm text-on-surface">{aiPlan.risk}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0D0D0D] p-4">
              <p className="font-label-caps text-label-caps text-on-surface-variant">FOCUS STACK</p>
              <ol className="mt-2 space-y-1 font-body-sm text-body-sm text-on-surface">
                {aiPlan.focusTasks.length ? (
                  aiPlan.focusTasks.map((task) => <li key={task.id}>{task.title}</li>)
                ) : (
                  <li>Review completed work</li>
                )}
              </ol>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-primary/25 bg-primary/10 p-4">
              <p className="font-label-caps text-label-caps text-primary">AI SUGGESTED NEXT TASK</p>
              <p className="mt-2 font-body-md text-body-md text-on-surface">{aiSuggestion.title}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0D0D0D] p-4">
              <p className="font-label-caps text-label-caps text-on-surface-variant">WHY</p>
              <p className="mt-2 font-body-sm text-body-sm text-on-surface">{aiSuggestion.detail}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0D0D0D] p-4">
              <p className="font-label-caps text-label-caps text-on-surface-variant">SCHEDULE</p>
              <p className="mt-2 font-body-sm text-body-sm text-on-surface">{aiSuggestion.window}</p>
            </div>
          </div>
        )}
      </CardSurface>

      {loadNotice ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 font-body-sm text-body-sm text-primary">
          {loadNotice}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-gutter">
        {view === "list" ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface">Active Roster</h3>
              <span className="px-3 py-1 bg-surface-container-high rounded-full border border-white/10 font-data-md text-data-md text-on-surface-variant">
                {rosterTasks.length}
              </span>
            </div>

            <CardSurface className="surface-card bg-[#1A1A1A] border border-white/20 rounded-xl flex flex-col p-0 overflow-hidden">
              <div className="hidden items-center px-6 py-4 border-b border-white/20 bg-surface-container/50 md:flex">
                <div className="w-10" />
                <div className="flex-1 font-label-caps text-label-caps text-on-surface-variant">
                  INITIATIVE
                </div>
                <div className="w-32 font-label-caps text-label-caps text-on-surface-variant">
                  DUE DATE
                </div>
                <div className="w-24 text-right font-label-caps text-label-caps text-on-surface-variant">
                  PRIORITY
                </div>
              </div>

              <div className="flex flex-col">
                {loading ? (
                  <LoadingSkeleton />
                ) : rosterTasks.length === 0 ? (
                  <div className="p-6 font-body-md text-body-md text-on-surface-variant">
                    No tasks yet. Add the first task below.
                  </div>
                ) : (
                  rosterTasks.map((task) => {
                    const done = task.done;
                    const saving = savingTaskIds.has(task.id);

                    return (
                      <div
                        className={`list-row grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 px-4 py-4 hover:bg-white/[0.02] border-b border-white/10 last:border-b-0 md:flex md:items-center md:px-6 ${saving ? "opacity-70" : ""}`}
                        key={task.id}
                      >
                        <div className="w-6 pt-1 md:w-10 md:pt-0">
                          <input
                            checked={done}
                            className="h-4 w-4 rounded border-white/20 bg-[#0D0D0D] text-primary"
                            disabled={saving}
                            type="checkbox"
                            onChange={() => toggleDone(task)}
                          />
                        </div>
                        <div className={`min-w-0 ${done ? "opacity-50" : ""} md:flex-1`}>
                          <h4 className={`font-body-md text-on-surface ${done ? "line-through" : ""}`}>
                            {task.title}
                          </h4>
                          <p className="font-data-md text-[12px] text-on-surface-variant opacity-70">
                            {task.category}
                          </p>
                          {rowErrors[task.id] ? (
                            <p className="mt-1 font-body-sm text-[12px] text-error" role="alert">
                              {rowErrors[task.id]}
                            </p>
                          ) : null}
                        </div>
                        <div className={`col-start-2 font-data-md ${dueDateClass(task.dueDate)} ${done ? "opacity-50" : ""} md:w-32`}>
                          {fmtDate(task.dueDate)}
                        </div>
                        <div className={`col-start-2 md:w-24 md:text-right ${done ? "opacity-50" : ""}`}>
                          <StitchPriorityBadge priority={task.priority} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardSurface>

            <CardSurface className="surface-card bg-[#1A1A1A] border border-white/20 rounded-xl p-6">
              <form className="grid grid-cols-1 gap-4 md:grid-cols-8" onSubmit={handleAddTask}>
                <input
                  className="md:col-span-2 bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-on-surface font-body-sm text-body-sm focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] outline-none"
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="New task"
                  type="text"
                  value={form.title}
                />
                <input
                  className="bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-on-surface font-body-sm text-body-sm focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] outline-none"
                  onChange={(event) => updateForm("project", event.target.value)}
                  placeholder="Project"
                  type="text"
                  value={form.project}
                />
                <select
                  className="bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-on-surface font-body-sm text-body-sm focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] outline-none"
                  onChange={(event) => updateForm("due_label", event.target.value)}
                  value={form.due_label}
                >
                  <option value="Today">Today</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="Friday">Friday</option>
                  <option value="Next week">Next week</option>
                </select>
                <input
                  className="bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-on-surface font-body-sm text-body-sm focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] outline-none"
                  onChange={(event) => updateForm("time_label", event.target.value)}
                  placeholder="Time"
                  type="time"
                  value={form.time_label}
                />
                <input
                  className="bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-on-surface font-body-sm text-body-sm focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] outline-none"
                  onChange={(event) => updateForm("estimate", event.target.value)}
                  placeholder="Estimate"
                  type="text"
                  value={form.estimate}
                />
                <select
                  className="bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-on-surface font-body-sm text-body-sm focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] outline-none"
                  onChange={(event) => updateForm("priority", event.target.value)}
                  value={form.priority}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <select
                  className="bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-on-surface font-body-sm text-body-sm focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] outline-none"
                  onChange={(event) => updateForm("column", event.target.value)}
                  value={form.column}
                >
                  <option value="todo">Todo</option>
                  <option value="wip">WIP</option>
                  <option value="done">Done</option>
                </select>
                <button
                  className="bg-[#F5A623] hover:bg-[#ffb955] text-black font-label-caps text-label-caps py-3 rounded-lg disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isAddingTask || !form.title.trim()}
                  type="submit"
                >
                  {isAddingTask ? "ADDING" : "ADD TASK"}
                </button>
                {formError ? (
                  <p className="md:col-span-8 font-body-sm text-body-sm text-error" role="alert">
                    {formError}
                  </p>
                ) : null}
              </form>
            </CardSurface>
          </div>
        ) : null}

        {view === "kanban" ? (
          <div className="flex flex-col gap-4">
            <h3 className="font-headline-md text-headline-md text-on-surface opacity-50">
              Workflow
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Drag cards between columns or use the move buttons on each card.
            </p>

            <div className="flex gap-4 overflow-x-auto">
              <KanbanColumn
                items={todoTasks}
                label="TO DO"
                onDragStart={handleDragStart}
                onDropTask={handleDropTask}
                onMove={moveTask}
                rowErrors={rowErrors}
                savingTaskIds={savingTaskIds}
                state="todo"
              />
              <KanbanColumn
                items={inProgressTasks}
                label="IN PROGRESS"
                onDragStart={handleDragStart}
                onDropTask={handleDropTask}
                onMove={moveTask}
                rowErrors={rowErrors}
                savingTaskIds={savingTaskIds}
                state="in-progress"
              />
              <KanbanColumn
                items={completedTasks}
                label="DONE"
                onDragStart={handleDragStart}
                onDropTask={handleDropTask}
                onMove={moveTask}
                rowErrors={rowErrors}
                savingTaskIds={savingTaskIds}
                state="done"
              />
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
