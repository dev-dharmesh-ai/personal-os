import { useCallback, useEffect, useMemo, useState } from "react";
import CardSurface from "../components/ui/CardSurface";
import PriorityBadge from "../components/ui/PriorityBadge";
import ProgressBar from "../components/ui/ProgressBar";
import { MOCK_USER_ID, isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "No date";
  return MONTHS[d.getMonth()] + " " + d.getDate();
}

function dueDateClass(iso) {
  const diff = Math.ceil((new Date(iso) - new Date()) / 86400000);
  if (Number.isNaN(diff)) return "text-on-surface-variant";
  if (diff <= 0) return "text-error";
  if (diff <= 3) return "text-primary";
  return "text-on-surface-variant";
}

function isoFromDueLabel(task, index) {
  const date = new Date();

  if (task.dueLabel === "Today") {
    date.setDate(date.getDate());
  } else if (task.dueLabel === "Tomorrow") {
    date.setDate(date.getDate() + 1);
  } else {
    date.setDate(date.getDate() + index + 1);
  }

  return date.toISOString();
}

function taskStatus(task, index) {
  if (task.column === "wip") return "in-progress";
  if (task.column === "done") return "done";
  if (task.column === "todo") return "todo";
  if (task.status) return task.status;
  if (index === 1) return "in-progress";
  return "todo";
}

function normalizedTask(task, index) {
  const dueLabel = task.due_label || task.dueLabel;
  const timeLabel = task.time_label || task.timeLabel;
  const dueDate = task.dueDate || task.due || dueLabel || isoFromDueLabel(task, index);

  return {
    ...task,
    dueLabel,
    timeLabel,
    category: task.project || task.category || [dueLabel, timeLabel].filter(Boolean).join(" / ") || "Operations",
    dueDate,
    progress: task.progress ?? (taskStatus(task, index) === "in-progress" ? 62 : 0),
    status: taskStatus(task, index),
  };
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

function KanbanCard({ task, state }) {
  const inProgress = state === "in-progress";
  const done = state === "done";

  return (
    <CardSurface
      className={`surface-card p-4 hover:-translate-y-1 transition-transform ${
        inProgress ? "border-primary/30" : ""
      } ${done ? "bg-surface-container-highest/50" : ""}`}
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
      </div>
    </CardSurface>
  );
}

function KanbanColumn({ label, state, items }) {
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

      <div className="flex flex-col gap-4">
        {items.map((task) => (
          <KanbanCard key={task.id} task={task} state={state} />
        ))}
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

function ErrorCard({ onRetry }) {
  return (
    <button
      className="m-6 rounded-xl border border-error/60 bg-error/10 p-6 text-left font-body-md text-body-md text-error"
      onClick={onRetry}
      type="button"
    >
      Failed to load. Tap to retry.
    </button>
  );
}

export default function TasksScreen() {
  const [view, setView] = useState("list");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    title: "",
    project: "",
    due_label: "Today",
    time_label: "",
    priority: "Medium",
    column: "todo",
    estimate: "",
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setError(new Error("Supabase is not configured."));
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", MOCK_USER_ID)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setTasks(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const rosterTasks = useMemo(() => tasks.map(normalizedTask), [tasks]);
  const kanbanTasks = rosterTasks;

  const todoTasks = kanbanTasks.filter((task) => task.status === "todo");
  const inProgressTasks = kanbanTasks.filter((task) => task.status === "in-progress");
  const completedTasks = kanbanTasks.filter((task) => task.status === "done");

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleAddTask(event) {
    event.preventDefault();

    if (!form.title.trim()) return;

    const { error: insertError } = await supabase.from("tasks").insert({
      user_id: MOCK_USER_ID,
      title: form.title.trim(),
      project: form.project.trim() || null,
      due_label: form.due_label.trim() || null,
      time_label: form.time_label.trim() || null,
      priority: form.priority,
      column: form.column,
      done: false,
      estimate: form.estimate.trim() || null,
    });

    if (insertError) {
      setError(insertError);
      return;
    }

    setForm({
      title: "",
      project: "",
      due_label: "Today",
      time_label: "",
      priority: "Medium",
      column: "todo",
      estimate: "",
    });
    fetchTasks();
  }

  async function toggleDone(task) {
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ done: !task.done })
      .eq("id", task.id)
      .eq("user_id", MOCK_USER_ID);

    if (updateError) {
      setError(updateError);
      return;
    }

    fetchTasks();
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

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface">Active Roster</h3>
            <span className="px-3 py-1 bg-surface-container-high rounded-full border border-white/10 font-data-md text-data-md text-on-surface-variant">
              {rosterTasks.length}
            </span>
          </div>

          <CardSurface className="surface-card bg-[#1A1A1A] border border-white/20 rounded-xl flex flex-col p-0 overflow-hidden">
            <div className="flex items-center px-6 py-4 border-b border-white/20 bg-surface-container/50">
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
              ) : error ? (
                <ErrorCard onRetry={fetchTasks} />
              ) : (
                rosterTasks.map((task) => {
                  const done = task.done;

                  return (
                    <div
                      className="list-row flex items-center px-6 py-4 hover:bg-white/[0.02] border-b border-white/10 last:border-b-0"
                      key={task.id}
                    >
                      <div className="w-10">
                        <input
                          checked={done}
                          className="h-4 w-4 rounded border-white/20 bg-[#0D0D0D] text-primary"
                          type="checkbox"
                          onChange={() => toggleDone(task)}
                        />
                      </div>
                      <div className={`flex-1 ${done ? "opacity-50" : ""}`}>
                        <h4 className={`font-body-md text-on-surface ${done ? "line-through" : ""}`}>
                          {task.title}
                        </h4>
                        <p className="font-data-md text-[12px] text-on-surface-variant opacity-70">
                          {task.category}
                        </p>
                      </div>
                      <div className={`w-32 font-data-md ${dueDateClass(task.dueDate)} ${done ? "opacity-50" : ""}`}>
                        {fmtDate(task.dueDate)}
                      </div>
                      <div className={`w-24 text-right ${done ? "opacity-50" : ""}`}>
                        <StitchPriorityBadge priority={task.priority} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardSurface>

          <CardSurface className="surface-card bg-[#1A1A1A] border border-white/20 rounded-xl p-6">
            <form className="grid grid-cols-1 gap-4 md:grid-cols-6" onSubmit={handleAddTask}>
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
                className="bg-[#F5A623] hover:bg-[#ffb955] text-black font-label-caps text-label-caps py-3 rounded-lg"
                type="submit"
              >
                ADD TASK
              </button>
            </form>
          </CardSurface>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          <h3 className="font-headline-md text-headline-md text-on-surface opacity-50">
            Workflow Preview
          </h3>

          <div className="flex gap-4 overflow-x-auto">
            <KanbanColumn label="TO DO" state="todo" items={todoTasks} />
            <KanbanColumn label="IN PROGRESS" state="in-progress" items={inProgressTasks} />
            <KanbanColumn label="DONE" state="done" items={completedTasks} />
          </div>
        </div>
      </section>
    </div>
  );
}
