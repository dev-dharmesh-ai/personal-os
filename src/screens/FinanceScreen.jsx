import { useCallback, useEffect, useMemo, useState } from "react";
import { transactions as mockTransactions } from "../data/mockData.js";
import { MOCK_USER_ID, isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const categoryIcons = {
  income: { icon: "arrow_downward", className: "text-[#B8F04A]" },
  food: { icon: "restaurant", className: "text-on-surface-variant" },
  infra: { icon: "shopping_cart", className: "text-on-surface-variant" },
  travel: { icon: "directions_car", className: "text-on-surface-variant" },
  utility: { icon: "bolt", className: "text-on-surface-variant" },
  default: { icon: "receipt_long", className: "text-on-surface-variant" },
};

const categoryBadgeClasses = {
  income: "bg-[#B8F04A]/15 text-[#B8F04A]",
  infra: "bg-[#F5A623]/15 text-[#F5A623]",
  utility: "bg-[#F5A623]/15 text-[#F5A623]",
  default: "bg-surface-variant text-on-surface-variant",
};

const categoryLabels = {
  income: "Income",
  food: "Food",
  infra: "Infra",
  travel: "Travel",
  utility: "Utility",
};

const expenseOptions = [
  { value: "food", label: "Food & Dining" },
  { value: "infra", label: "Infrastructure" },
  { value: "travel", label: "Travel" },
  { value: "utility", label: "Utilities" },
];

const incomeOptions = [
  { value: "income", label: "Income" },
];

const smokeTestNamePatterns = [/^smoke income\b/i, /^cab expense$/i];

function fmtINR(amount) {
  const value = Number(amount || 0);
  const formattedValue = Math.abs(value).toLocaleString("en-IN");
  return value < 0 ? "-₹" + formattedValue : "₹" + formattedValue;
}

function formatDate(date) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "No date";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDateValue(date) {
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isSmokeTestTransaction(transaction) {
  const name = String(transaction.name || "").trim();

  return smokeTestNamePatterns.some((pattern) => pattern.test(name));
}

function buildDemoTransactions() {
  const today = new Date();

  return mockTransactions.map((transaction, index) => {
    const transactionDate = new Date(today);
    transactionDate.setDate(today.getDate() - index);

    return {
      ...transaction,
      id: `demo-${transaction.id}`,
      date: toISODate(transactionDate),
      created_at: transactionDate.toISOString(),
    };
  });
}

function sortTransactions(transactions) {
  return transactions.filter((transaction) => !isSmokeTestTransaction(transaction)).sort((a, b) => {
    const dateDiff =
      (toDateValue(b.date)?.getTime() || 0) - (toDateValue(a.date)?.getTime() || 0);

    if (dateDiff !== 0) return dateDiff;

    return (
      (toDateValue(b.created_at)?.getTime() || 0) -
      (toDateValue(a.created_at)?.getTime() || 0)
    );
  });
}

function isSameMonth(date, referenceDate) {
  const parsedDate = toDateValue(date);

  return (
    parsedDate &&
    parsedDate.getFullYear() === referenceDate.getFullYear() &&
    parsedDate.getMonth() === referenceDate.getMonth()
  );
}

function isPreviousMonth(date, referenceDate) {
  const parsedDate = toDateValue(date);
  const previousMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);

  return (
    parsedDate &&
    parsedDate.getFullYear() === previousMonth.getFullYear() &&
    parsedDate.getMonth() === previousMonth.getMonth()
  );
}

function calculateNet(transactions) {
  return transactions.reduce((total, transaction) => {
    const amount = Number(transaction.amount || 0);

    if (transaction.type === "income") return total + amount;
    if (transaction.type === "expense") return total - amount;
    return total;
  }, 0);
}

function suggestCategory(description, type) {
  if (type === "income") return "income";

  const text = description.toLowerCase();

  if (/(uber|ola|cab|taxi|metro|fuel|flight|train|parking)/.test(text)) return "travel";
  if (/(rent|electric|electricity|internet|mobile|recharge|utility|bill)/.test(text)) {
    return "utility";
  }
  if (/(aws|vercel|server|domain|hosting|software|subscription|workspace)/.test(text)) {
    return "infra";
  }

  return "food";
}

function getInsight(transactions) {
  const expenseTotals = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((totals, transaction) => {
      const category = transaction.category || "default";
      totals[category] = (totals[category] || 0) + Number(transaction.amount || 0);
      return totals;
    }, {});
  const topCategory = Object.entries(expenseTotals).sort((a, b) => b[1] - a[1])[0];

  if (!topCategory) {
    return "Add a few entries to surface spending patterns.";
  }

  return `${categoryLabels[topCategory[0]] || topCategory[0]} is your largest spend bucket at ${fmtINR(
    topCategory[1],
  )}.`;
}

function FieldLabel({ children }) {
  return (
    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
      {children}
    </label>
  );
}

function StatCard({ icon, iconClassName, wrapperClassName, label, value, fillClassName, fillWidth }) {
  return (
    <div className="bg-[#1A1A1A] border border-white/20 rounded-xl p-6 flex-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-label-caps text-label-caps text-on-surface-variant">{label}</p>
          <p className="mt-4 font-data-lg text-data-lg text-on-surface">{fmtINR(value)}</p>
        </div>
        <div className={`p-2 rounded-lg ${wrapperClassName}`}>
          <span className={`material-symbols-outlined ${iconClassName}`}>{icon}</span>
        </div>
      </div>
      <div className="mt-6 bg-[#2A2A2A] h-1.5 rounded-full overflow-hidden">
        <div className={`h-full ${fillClassName}`} style={{ width: fillWidth }} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[0, 1, 2, 3, 4].map((item) => (
        <div className="h-16 animate-pulse rounded-lg bg-white/10" key={item} />
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

function EmptyState() {
  return (
    <div className="m-6 rounded-xl border border-white/10 bg-white/5 p-6 font-body-md text-body-md text-on-surface-variant">
      No transactions yet. Add your first entry to start tracking cashflow.
    </div>
  );
}

export default function FinanceScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataNotice, setDataNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    description: "",
    category: "food",
    date: getTodayDateValue(),
  });
  const [txType, setTxType] = useState("expense");
  const selectOptions = txType === "income" ? incomeOptions : expenseOptions;

  const useDemoTransactions = useCallback((notice) => {
    setTransactions(sortTransactions(buildDemoTransactions()));
    setDataNotice(notice);
    setError(null);
    setLoading(false);
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      useDemoTransactions("Demo mode: sample transactions are shown locally.");
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", MOCK_USER_ID)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (fetchError) {
      useDemoTransactions("Live data unavailable. Demo transactions are shown locally.");
      return;
    }

    setTransactions(sortTransactions(data || []));
    setDataNotice("");
    setLoading(false);
  }, [useDemoTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const financeStats = useMemo(() => {
    const today = new Date();
    const currentMonthTransactions = transactions.filter((transaction) =>
      isSameMonth(transaction.date || transaction.created_at, today),
    );
    const previousMonthTransactions = transactions.filter((transaction) =>
      isPreviousMonth(transaction.date || transaction.created_at, today),
    );
    const inflow = currentMonthTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
    const outflow = currentMonthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
    const monthlyNet = inflow - outflow;
    const previousMonthNet = calculateNet(previousMonthTransactions);
    const deltaPercent = previousMonthNet
      ? Number((((monthlyNet - previousMonthNet) / Math.abs(previousMonthNet)) * 100).toFixed(1))
      : null;
    const spendProgress = Math.min((outflow / Math.max(inflow, outflow, 1)) * 100, 100);
    const savingsCapacity = Math.max(monthlyNet, 0);
    const savingsProgress = Math.min((savingsCapacity / Math.max(inflow, 1)) * 100, 100);

    return {
      totalBalance: calculateNet(transactions),
      deltaPercent,
      financeSignal: monthlyNet >= 0 ? "Net positive this month" : "Spend above income",
      financeSignalClass:
        monthlyNet >= 0
          ? "border-[#B8F04A]/20 bg-[#B8F04A]/10 text-[#B8F04A]"
          : "border-[#F5A623]/20 bg-[#F5A623]/10 text-[#F5A623]",
      inflow,
      outflow,
      monthlySpend: outflow,
      savingsCapacity,
      spendProgress: `${spendProgress}%`,
      savingsProgress: `${savingsProgress}%`,
    };
  }, [transactions]);

  const updateForm = (field, value) => {
    setFormError("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleTypeChange = (type) => {
    setTxType(type);
    setFormError("");
    setForm((current) => ({
      ...current,
      category:
        type === "income" ? "income" : current.category === "income" ? "food" : current.category,
    }));
  };

  const handleSuggestCategory = () => {
    const category = suggestCategory(form.description, txType);
    setFormError("");
    setForm((current) => ({ ...current, category }));
  };

  const addLocalTransaction = (transaction) => {
    setTransactions((current) => sortTransactions([transaction, ...current]));
    setDataNotice("Entry saved locally for this demo session.");
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const description = form.description.trim();
    const amount = Number(form.amount);

    if (!form.amount) {
      setFormError("Enter an amount.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter a valid amount greater than zero.");
      return;
    }

    if (!description) {
      setFormError("Enter a description.");
      return;
    }

    if (!form.date) {
      setFormError("Choose a transaction date.");
      return;
    }

    if (!toDateValue(form.date)) {
      setFormError("Choose a valid transaction date.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    const newTransaction = {
      id: `local-${Date.now()}`,
      user_id: MOCK_USER_ID,
      name: description,
      note: null,
      date: form.date,
      category: form.category,
      type: txType,
      amount: Math.abs(amount),
      created_at: new Date().toISOString(),
    };

    try {
      if (!isSupabaseConfigured || dataNotice) {
        addLocalTransaction(newTransaction);
        setForm({
          amount: "",
          description: "",
          category: "food",
          date: getTodayDateValue(),
        });
        setTxType("expense");
        return;
      }

      const { error: insertError } = await supabase.from("transactions").insert({
        user_id: newTransaction.user_id,
        name: newTransaction.name,
        note: newTransaction.note,
        date: newTransaction.date,
        category: newTransaction.category,
        type: newTransaction.type,
        amount: newTransaction.amount,
      });

      if (insertError) {
        addLocalTransaction(newTransaction);
        setFormError("Live sync failed. Entry saved locally for the demo.");
        return;
      }

      setForm({
        amount: "",
        description: "",
        category: "food",
        date: getTodayDateValue(),
      });
      setTxType("expense");
      await fetchTransactions();
    } catch (submitError) {
      addLocalTransaction(newTransaction);
      setFormError("Live sync failed. Entry saved locally for the demo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-margin-mobile md:p-margin-desktop space-y-8 max-w-[1200px] w-full mx-auto overflow-y-auto">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-8 bg-[#1A1A1A] border border-white/20 rounded-xl p-6 relative overflow-hidden hover:border-white/40 transition-colors min-h-[280px] flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 to-transparent pointer-events-none" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <p className="font-label-caps text-label-caps text-on-surface-variant">
                TOTAL BALANCE
              </p>
              <div className="mt-4 break-words font-data-lg text-[clamp(2rem,8vw,3rem)] leading-tight tracking-tight text-on-surface">
                {fmtINR(financeStats.totalBalance)}
                <span className="text-on-surface-variant">.00</span>
              </div>
            </div>
            <div
              className={`self-start px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${financeStats.financeSignalClass}`}
            >
              {typeof financeStats.deltaPercent === "number" ? (
                <>
                  <span className="material-symbols-outlined text-[16px]">
                    {financeStats.deltaPercent >= 0 ? "trending_up" : "trending_down"}
                  </span>
                  <span className="font-data-md text-data-md">
                    {financeStats.deltaPercent > 0 ? "+" : ""}
                    {financeStats.deltaPercent}%
                  </span>
                </>
              ) : (
                <span className="font-data-md text-data-md">{financeStats.financeSignal}</span>
              )}
            </div>
          </div>

          <div className="relative border-t border-white/10 pt-6 mt-auto flex items-end gap-6">
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant">
                INFLOW THIS MONTH
              </p>
              <p className="mt-2 font-data-lg text-data-lg text-on-surface">
                {fmtINR(financeStats.inflow)}
              </p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant">
                OUTFLOW THIS MONTH
              </p>
              <p className="mt-2 font-data-lg text-data-lg text-on-surface">
                {fmtINR(financeStats.outflow)}
              </p>
            </div>
          </div>

          <div className="relative mt-6 rounded-lg border border-[#B8F04A]/20 bg-[#B8F04A]/10 p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#B8F04A]">
                auto_awesome
              </span>
              <div>
                <p className="font-label-caps text-label-caps text-[#B8F04A]">
                  AI CASHFLOW INSIGHT
                </p>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface">
                  {getInsight(transactions)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-gutter">
          <StatCard
            icon="credit_card"
            iconClassName="text-[#F5A623]"
            wrapperClassName="bg-[#F5A623]/10"
            label="MONTHLY SPEND"
            value={financeStats.monthlySpend}
            fillClassName="bg-[#F5A623]"
            fillWidth={financeStats.spendProgress}
          />
          <StatCard
            icon="savings"
            iconClassName="text-[#B8F04A]"
            wrapperClassName="bg-[#B8F04A]/10"
            label="SAVINGS CAPACITY"
            value={financeStats.savingsCapacity}
            fillClassName="bg-[#B8F04A]"
            fillWidth={financeStats.savingsProgress}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-8 bg-[#1A1A1A] border border-white/20 rounded-xl flex flex-col h-[500px]">
          <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-label-caps text-label-caps text-on-surface">
                RECENT TRANSACTIONS
              </h2>
              {dataNotice ? (
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {dataNotice}
                </p>
              ) : null}
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 font-label-caps text-label-caps text-on-surface-variant">
              {transactions.length} ITEMS
            </span>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <ErrorCard onRetry={fetchTransactions} />
            ) : transactions.length === 0 ? (
              <EmptyState />
            ) : (
              transactions.map((transaction) => {
                const icon = categoryIcons[transaction.category] || categoryIcons.default;
                const badgeClass =
                  categoryBadgeClasses[transaction.category] || categoryBadgeClasses.default;
                const isIncome = transaction.type === "income";

                return (
                  <div
                    className="flex items-center justify-between p-4 hover:bg-white/5 rounded-lg border-b border-white/5 last:border-0 transition-colors"
                    key={transaction.id}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-surface-container border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className={`material-symbols-outlined ${icon.className}`}>
                          {icon.icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-body-md text-body-md text-on-surface font-medium truncate">
                          {transaction.name}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-data-md text-[12px] text-on-surface-variant">
                            {formatDate(transaction.date)}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-label-caps ${badgeClass}`}
                          >
                            {categoryLabels[transaction.category] || transaction.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-data-lg text-data-lg text-right ${
                        isIncome ? "text-[#B8F04A]" : "text-on-surface"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {fmtINR(transaction.amount)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#1A1A1A] border border-white/20 rounded-xl flex flex-col h-[500px]">
          <div className="p-6 border-b border-white/10 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface">
              add_circle
            </span>
            <h2 className="font-label-caps text-label-caps text-on-surface">NEW ENTRY</h2>
          </div>

          <div className="p-6 flex-1 flex flex-col space-y-4">
            <div className="space-y-2">
              <FieldLabel>AMOUNT (₹)</FieldLabel>
              <input
                className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-3 text-on-surface font-data-lg text-data-lg focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] outline-none"
                onChange={(event) => updateForm("amount", event.target.value)}
                placeholder="0.00"
                type="number"
                value={form.amount}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>DESCRIPTION</FieldLabel>
              <input
                className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-on-surface font-body-sm text-body-sm focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] outline-none"
                onChange={(event) => updateForm("description", event.target.value)}
                placeholder="Merchant or notes"
                type="text"
                value={form.description}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel>CATEGORY</FieldLabel>
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-[#B8F04A]/30 px-2 py-1 font-label-caps text-[10px] text-[#B8F04A] transition-colors hover:bg-[#B8F04A]/10"
                    onClick={handleSuggestCategory}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    AI
                  </button>
                </div>
                <select
                  className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-on-surface font-body-sm text-body-sm focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] outline-none appearance-none"
                  onChange={(event) => updateForm("category", event.target.value)}
                  value={form.category}
                >
                  {selectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 min-w-0">
                <FieldLabel>DATE</FieldLabel>
                <input
                  className="w-full bg-[#0D0D0D] border border-white/20 rounded-lg px-4 py-2.5 text-on-surface font-body-sm text-body-sm focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] outline-none [color-scheme:dark]"
                  onChange={(event) => updateForm("date", event.target.value)}
                  type="date"
                  value={form.date}
                />
              </div>
            </div>

            <div className="flex p-1 bg-[#0D0D0D] rounded-lg border border-white/10">
              <button
                className={`flex-1 rounded-md px-3 py-2 font-label-caps text-label-caps transition-colors ${
                  txType === "expense"
                    ? "bg-surface-variant text-on-surface"
                    : "text-on-surface-variant"
                }`}
                onClick={() => handleTypeChange("expense")}
                type="button"
              >
                EXPENSE
              </button>
              <button
                className={`flex-1 rounded-md px-3 py-2 font-label-caps text-label-caps transition-colors ${
                  txType === "income"
                    ? "bg-surface-variant text-on-surface"
                    : "text-on-surface-variant"
                }`}
                onClick={() => handleTypeChange("income")}
                type="button"
              >
                INCOME
              </button>
            </div>

            <div className="mt-auto space-y-3">
              {formError ? (
                <p className="font-body-sm text-body-sm text-error" role="alert">
                  {formError}
                </p>
              ) : null}
              <button
                className="w-full rounded-lg bg-[#F5A623] py-3 font-label-caps text-label-caps text-black transition-colors hover:bg-[#ffb955] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                onClick={handleSubmit}
                type="button"
              >
                {submitting ? "SAVING..." : "SUBMIT ENTRY"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
