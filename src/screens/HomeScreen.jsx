import { useCallback, useEffect, useMemo, useState } from "react";
import { journalEntries } from "../data/mockData.js";
import CardSurface from "../components/ui/CardSurface.jsx";
import PrimaryButton from "../components/ui/PrimaryButton.jsx";
import DeltaBadge from "../components/ui/DeltaBadge.jsx";
import LockedCard from "../components/ui/LockedCard.jsx";
import { MOCK_USER_ID, isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

const priorityDotClasses = {
  High: "bg-error",
  Medium: "bg-primary-container",
  Low: "bg-secondary-fixed",
};

const dueLabelRank = {
  Yesterday: 0,
  Today: 1,
  Tomorrow: 2,
};

function fmtINR(amount) {
  const value = Math.abs(amount).toLocaleString("en-IN");
  return amount < 0 ? "-₹" + value : "₹" + value;
}

function normalizeTask(task) {
  return {
    ...task,
    dueLabel: task.due_label || task.dueLabel || "No due date",
    timeLabel: task.time_label || task.timeLabel || "--",
    priority: task.priority || "Low",
  };
}

function isOpenTask(task) {
  return !task.done && task.column !== "done";
}

function sortOpenTasks(a, b) {
  const dueDiff =
    (dueLabelRank[a.dueLabel] ?? Number.MAX_SAFE_INTEGER) -
    (dueLabelRank[b.dueLabel] ?? Number.MAX_SAFE_INTEGER);

  if (dueDiff !== 0) return dueDiff;

  return String(a.timeLabel).localeCompare(String(b.timeLabel));
}

function DashboardTasksLoading() {
  return (
    <li className="flex flex-col gap-3 py-5">
      {[0, 1, 2].map((item) => (
        <div className="h-12 animate-pulse rounded-lg bg-white/10" key={item} />
      ))}
    </li>
  );
}

function DashboardTasksMessage({ children, onRetry }) {
  if (onRetry) {
    return (
      <li className="py-5">
        <button
          className="rounded-lg border border-error/50 bg-error/10 px-4 py-3 text-left font-body-md text-body-md text-error"
          onClick={onRetry}
          type="button"
        >
          {children}
        </button>
      </li>
    );
  }

  return (
    <li className="py-5 font-body-md text-body-md text-on-surface-variant">{children}</li>
  );
}

function calculateBalance(transactions) {
  return transactions.reduce((total, transaction) => {
    const amount = Number(transaction.amount || 0);

    if (transaction.type === "income") return total + amount;
    if (transaction.type === "expense") return total - amount;
    return total;
  }, 0);
}

function calculateBalanceDelta(transactions) {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const balanceBeforeThisWeek = calculateBalance(
    transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date || transaction.created_at);
      return !Number.isNaN(transactionDate.getTime()) && transactionDate < sevenDaysAgo;
    }),
  );

  if (!balanceBeforeThisWeek) return 0;

  const currentBalance = calculateBalance(transactions);
  const delta = ((currentBalance - balanceBeforeThisWeek) / Math.abs(balanceBeforeThisWeek)) * 100;

  return Number(delta.toFixed(1));
}

function LiquidAssetsValue({ balance, loading, error }) {
  if (loading) {
    return <div className="h-14 w-40 animate-pulse rounded-lg bg-white/10" />;
  }

  if (error) {
    return (
      <p className="font-body-md text-body-md text-error">
        Balance unavailable
      </p>
    );
  }

  return (
    <div className="font-data-lg text-display-lg text-secondary-fixed mb-2 tracking-tight">
      {fmtINR(balance)}
    </div>
  );
}

export default function HomeScreen() {
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [financeError, setFinanceError] = useState(null);
  const journalEntry = journalEntries[0];

  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksError(null);

    if (!isSupabaseConfigured) {
      setTasksError(new Error("Supabase is not configured."));
      setTasksLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("id,title,due_label,time_label,priority,column,done,created_at")
      .eq("user_id", MOCK_USER_ID)
      .order("created_at", { ascending: false });

    if (error) {
      setTasksError(error);
      setTasksLoading(false);
      return;
    }

    setTasks(data || []);
    setTasksLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const fetchTransactions = useCallback(async () => {
    setFinanceLoading(true);
    setFinanceError(null);

    if (!isSupabaseConfigured) {
      setFinanceError(new Error("Supabase is not configured."));
      setFinanceLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("amount,type,date,created_at")
      .eq("user_id", MOCK_USER_ID);

    if (error) {
      setFinanceError(error);
      setFinanceLoading(false);
      return;
    }

    setTransactions(data || []);
    setFinanceLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const openTasks = useMemo(
    () => tasks.map(normalizeTask).filter(isOpenTask).sort(sortOpenTasks),
    [tasks],
  );
  const dueTodayCount = openTasks.filter((task) => task.dueLabel === "Today").length;
  const currentBalance = useMemo(() => calculateBalance(transactions), [transactions]);
  const balanceDelta = useMemo(() => calculateBalanceDelta(transactions), [transactions]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <CardSurface className="md:col-span-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface">Tasks</h3>
            <span className="font-label-caps text-label-caps bg-primary-container/15 text-primary-container px-3 py-1 rounded-full">
              {dueTodayCount} DUE TODAY
            </span>
          </div>
          <ul className="flex flex-col flex-1 border-t border-outline-variant/10">
            {tasksLoading ? (
              <DashboardTasksLoading />
            ) : tasksError ? (
              <DashboardTasksMessage onRetry={fetchTasks}>
                Failed to load tasks. Tap to retry.
              </DashboardTasksMessage>
            ) : openTasks.length ? (
              openTasks.map((task) => (
                <li
                  className="flex items-center justify-between gap-4 py-5 border-b border-outline-variant/10 group"
                  key={task.id}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="w-5 h-5 rounded-sm border border-outline-variant/40 bg-[#0D0D0D] flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="block truncate font-body-lg text-body-lg text-on-surface group-hover:text-primary-container transition-colors">
                        {task.title}
                      </span>
                      <span className="font-data-md text-[11px] text-on-surface-variant">
                        {task.dueLabel}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        priorityDotClasses[task.priority] || priorityDotClasses.Low
                      }`}
                    />
                    <span className="font-data-md text-data-md text-on-surface-variant">
                      {task.timeLabel}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <DashboardTasksMessage>No pending or due tasks.</DashboardTasksMessage>
            )}
          </ul>
        </CardSurface>

        <CardSurface className="md:col-span-4 h-[220px] self-start justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant">
                LIQUID ASSETS
              </h3>
              <span className="material-symbols-outlined text-on-surface-variant">
                account_balance_wallet
              </span>
            </div>
            <LiquidAssetsValue
              balance={currentBalance}
              error={financeError}
              loading={financeLoading}
            />
          </div>
          <div>
            <DeltaBadge value={balanceDelta} label="vs last week" />
          </div>
        </CardSurface>

        <CardSurface className="md:col-span-6 justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface">Journal Log</h3>
            <span className="font-data-md text-data-md text-on-surface-variant">
              {journalEntry.dateLabel}
            </span>
          </div>
          <div className="mb-8 flex-1">
            <p className="font-body-md text-body-lg text-on-surface-variant line-clamp-2 italic border-l-2 border-outline-variant/30 pl-4 py-1">
              &quot;{journalEntry.firstSentence}&quot;
            </p>
          </div>
          <PrimaryButton>CONTINUE ENTRY</PrimaryButton>
        </CardSurface>

        <CardSurface className="md:col-span-6 relative overflow-hidden justify-center items-center min-h-[200px]">
          <LockedCard
            title="HABIT TRACKER"
            subtitle="Module currently offline. Coming in v2.1."
          />
        </CardSurface>
      </div>
    </div>
  );
}
