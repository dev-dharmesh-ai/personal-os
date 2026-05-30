import { useCallback, useEffect, useMemo, useState } from "react";
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

const selectOptions = [
  { value: "food", label: "Food & Dining" },
  { value: "infra", label: "Infrastructure" },
  { value: "travel", label: "Travel" },
  { value: "utility", label: "Utilities" },
  { value: "income", label: "Income" },
];

function fmtINR(amount) {
  const value = Number(amount || 0);
  const formattedValue = Math.abs(value).toLocaleString("en-IN");
  return value < 0 ? "-₹" + formattedValue : "₹" + formattedValue;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

export default function FinanceScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    description: "",
    category: "food",
    date: "",
    type: "expense",
  });
  const [txType, setTxType] = useState("expense");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setError(new Error("Supabase is not configured."));
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", MOCK_USER_ID)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setTransactions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const financeStats = useMemo(() => {
    const inflow = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
    const outflow = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

    return {
      totalBalance: inflow - outflow,
      deltaPercent: null,
      inflow,
      outflow,
      upcomingBills: outflow,
      savingsGoal: inflow,
    };
  }, [transactions]);

  const updateForm = (field, value) => {
    setFormError("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleTypeChange = (type) => {
    setTxType(type);
    updateForm("type", type);
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

    setSubmitting(true);
    setFormError("");

    try {
      const { error: insertError } = await supabase.from("transactions").insert({
        user_id: MOCK_USER_ID,
        name: description,
        note: null,
        date: form.date,
        category: form.category,
        type: txType,
        amount: Math.abs(amount),
      });

      if (insertError) {
        setError(insertError);
        setFormError("Could not save entry. Please try again.");
        return;
      }

      setForm({
        amount: "",
        description: "",
        category: "food",
        date: "",
        type: "expense",
      });
      setTxType("expense");
      await fetchTransactions();
    } catch (submitError) {
      setError(submitError);
      setFormError("Could not save entry. Please try again.");
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
            {typeof financeStats.deltaPercent === "number" ? (
              <div className="self-start bg-[#B8F04A]/10 px-3 py-1.5 rounded-full border border-[#B8F04A]/20 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#B8F04A] text-[16px]">
                  trending_up
                </span>
                <span className="text-[#B8F04A] font-data-md text-data-md">
                  +{financeStats.deltaPercent}%
                </span>
              </div>
            ) : null}
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
        </div>

        <div className="lg:col-span-4 flex flex-col gap-gutter">
          <StatCard
            icon="credit_card"
            iconClassName="text-[#F5A623]"
            wrapperClassName="bg-[#F5A623]/10"
            label="UPCOMING BILLS"
            value={financeStats.upcomingBills}
            fillClassName="bg-[#F5A623]"
            fillWidth="65%"
          />
          <StatCard
            icon="savings"
            iconClassName="text-[#B8F04A]"
            wrapperClassName="bg-[#B8F04A]/10"
            label="SAVINGS GOAL"
            value={financeStats.savingsGoal}
            fillClassName="bg-[#B8F04A]"
            fillWidth="40%"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-8 bg-[#1A1A1A] border border-white/20 rounded-xl flex flex-col h-[500px]">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-label-caps text-label-caps text-on-surface">
              RECENT TRANSACTIONS
            </h2>
            <button
              className="text-primary font-label-caps text-label-caps flex items-center gap-1"
              onClick={() => {}}
              type="button"
            >
              VIEW ALL
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <ErrorCard onRetry={fetchTransactions} />
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
                <FieldLabel>CATEGORY</FieldLabel>
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
