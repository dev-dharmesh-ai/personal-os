import { useEffect, useMemo, useState } from "react";
import { tasks as demoTasks } from "../data/mockData";
import { MOCK_USER_ID, isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SMOKE_TEST_TASK_PATTERNS = [/smoke/i, /task-1 testing-1/i, /manual smoke test/i];

function monthLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function isSmokeTestTask(task) {
  return SMOKE_TEST_TASK_PATTERNS.some((pattern) => pattern.test(task.title || ""));
}

function productionTasks(taskList) {
  return taskList.filter((task) => !isSmokeTestTask(task));
}

function dateFromDueLabel(task, index) {
  const dueLabel = task.due_label || task.dueLabel;
  const normalizedLabel = dueLabel?.toLowerCase();
  const date = new Date();

  date.setHours(9 + index * 2, 0, 0, 0);

  if (normalizedLabel === "tomorrow") {
    date.setDate(date.getDate() + 1);
  } else if (normalizedLabel === "yesterday") {
    date.setDate(date.getDate() - 1);
  } else if (normalizedLabel === "next week") {
    date.setDate(date.getDate() + 7);
  } else if (normalizedLabel !== "today") {
    date.setDate(date.getDate() + index);
  }

  return date;
}

function taskEventDate(task, index) {
  const savedDate = task.dueDate || task.due || task.due_date;
  const parsedDate = savedDate ? new Date(savedDate) : null;

  if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  return dateFromDueLabel(task, index);
}

function formatEventTime(task, date) {
  const timeLabel = task.time_label || task.timeLabel;

  if (timeLabel) return timeLabel;

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeTaskEvents(taskList) {
  return productionTasks(taskList)
    .slice(0, 3)
    .map((task, index) => {
      const date = taskEventDate(task, index);

      return {
        id: task.id || `task-${index}`,
        date,
        day: date.getDate(),
        month: date.getMonth(),
        title: task.title,
        time: formatEventTime(task, date),
        year: date.getFullYear(),
      };
    });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function CalendarScreen() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [tasks, setTasks] = useState(() => productionTasks(demoTasks));
  const today = new Date();
  const todayDate = today.getDate();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const startOffset = (monthStart.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const days = Array.from({ length: totalCells }, (_, index) => {
    const day = index - startOffset + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const taskEvents = useMemo(() => normalizeTaskEvents(tasks), [tasks]);

  useEffect(() => {
    let ignore = false;

    async function fetchTaskDates() {
      if (!isSupabaseConfigured) return;

      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", MOCK_USER_ID)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!ignore && !error && data?.length) {
          setTasks(productionTasks(data));
        }
      } catch (error) {
        // Demo data remains visible when live sync is unavailable.
      }
    }

    fetchTaskDates();

    return () => {
      ignore = true;
    };
  }, []);

  function handleNotify(event) {
    event.preventDefault();

    if (!isValidEmail(email.trim())) {
      setNotice("Please enter a valid email address.");
      return;
    }

    setNotice("We will notify you soon.");
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4 md:p-margin-desktop">
      <section className="w-full max-w-5xl rounded-xl border border-white/20 bg-[#1A1A1A] p-5 md:p-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display-lg text-display-lg leading-none text-on-surface">
            Calendar
          </h2>
          <p className="mt-4 font-body-md text-body-md text-on-surface-variant">
            Unified scheduling across tasks, finance, and journal rhythms — coming soon.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="rounded-xl border border-white/20 bg-[#0D0D0D] p-4 md:p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="font-headline-md text-headline-md text-on-surface">
                {monthLabel(today)}
              </p>
              <span className="rounded-full border border-[#F5A623]/30 bg-[#F5A623]/15 px-3 py-1 font-label-caps text-label-caps text-[#F5A623]">
                COMING SOON
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <div
                  className="pb-2 text-center font-data-md text-[10px] uppercase text-on-surface-variant"
                  key={day}
                >
                  {day}
                </div>
              ))}

              {days.map((day, index) => {
                const isToday = day === todayDate;
                const dayEvents = taskEvents.filter(
                  (event) =>
                    event.day === day &&
                    event.month === today.getMonth() &&
                    event.year === today.getFullYear(),
                );

                return (
                  <div
                    className={`flex aspect-square flex-col items-start gap-1 overflow-hidden rounded-lg border p-2 font-data-md text-[11px] ${
                      isToday
                        ? "border-[#F5A623] bg-[#F5A623]/15 text-[#F5A623]"
                        : day
                          ? "border-white/10 bg-[#1A1A1A] text-on-surface-variant"
                          : "border-white/5 bg-transparent"
                    }`}
                    key={`${day || "blank"}-${index}`}
                  >
                    {day ? <span>{day}</span> : null}
                    {dayEvents.slice(0, 2).map((event) => (
                      <span
                        className="w-full truncate rounded bg-primary/15 px-1.5 py-0.5 font-body-sm text-[10px] text-primary"
                        key={event.id}
                        title={event.title}
                      >
                        {event.title}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="rounded-xl border border-white/20 bg-[#0D0D0D] p-4 md:p-5">
            <p className="font-label-caps text-label-caps text-primary">TASK SYNC PREVIEW</p>
            <h3 className="mt-2 font-headline-md text-headline-md text-on-surface">
              Upcoming task dates
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              {taskEvents.slice(0, 2).map((event) => (
                <div className="rounded-lg border border-white/10 bg-[#1A1A1A] p-3" key={event.id}>
                  <p className="font-data-md text-[11px] text-primary">
                    {event.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {event.time}
                  </p>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface">{event.title}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <form
          className="mx-auto mt-6 flex max-w-3xl flex-col gap-3 rounded-xl border border-white/20 bg-[#0D0D0D] p-4 md:flex-row md:items-start"
          noValidate
          onSubmit={handleNotify}
        >
          <div className="min-w-0 flex-1">
            <input
              className="w-full rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-3 font-body-sm text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623]"
              onChange={(event) => {
                setEmail(event.target.value);
                setNotice("");
              }}
              placeholder="Email address"
              type="email"
              value={email}
            />
            {notice ? (
              <p
                className={`mt-2 font-body-sm text-[12px] ${
                  notice.startsWith("Please") ? "text-error" : "text-primary"
                }`}
                role="status"
              >
                {notice}
              </p>
            ) : null}
          </div>
          <button
            className="rounded-lg bg-[#F5A623] px-5 py-3 font-label-caps text-label-caps text-black transition-opacity hover:opacity-90"
            type="submit"
          >
            Notify me
          </button>
        </form>
      </section>
    </div>
  );
}
