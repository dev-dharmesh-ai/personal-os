export const tasks = [
  {
    id: "task-1",
    title: "Review May budget",
    dueLabel: "Today",
    timeLabel: "10:00",
    priority: "High",
    done: false,
  },
  {
    id: "task-2",
    title: "Renew health insurance",
    dueLabel: "Today",
    timeLabel: "15:30",
    priority: "Medium",
    done: false,
  },
  {
    id: "task-3",
    title: "Plan grocery order",
    dueLabel: "Tomorrow",
    timeLabel: "18:00",
    priority: "Low",
    done: false,
  },
];

export const financeStats = {
  balance: 48320,
  delta: 2.4,
  totalBalance: 48320,
  deltaPercent: 2.4,
  inflow: 125000,
  outflow: 76680,
  upcomingBills: 18500,
  savingsGoal: 200000,
};

export const transactions = [
  {
    id: "tx-1",
    name: "Consulting Payment",
    date: "2023-10-24",
    category: "income",
    type: "income",
    amount: 85000,
  },
  {
    id: "tx-2",
    name: "Rent",
    date: "2023-10-23",
    category: "utility",
    type: "expense",
    amount: 28000,
  },
  {
    id: "tx-3",
    name: "Groceries",
    date: "2023-10-22",
    category: "food",
    type: "expense",
    amount: 3620,
  },
  {
    id: "tx-4",
    name: "Metro Card Reload",
    date: "2023-10-21",
    category: "travel",
    type: "expense",
    amount: 1200,
  },
  {
    id: "tx-5",
    name: "Electricity Bill",
    date: "2023-10-20",
    category: "utility",
    type: "expense",
    amount: 2840,
  },
  {
    id: "tx-6",
    name: "Mobile Recharge",
    date: "2023-10-18",
    category: "utility",
    type: "expense",
    amount: 799,
  },
];

export const journalEntries = [
  {
    id: "journal-1",
    dateLabel: "May 28",
    firstSentence:
      "The day feels cleaner when money, tasks, and notes are all visible in one place. Keep tomorrow focused on the few open loops that matter.",
  },
];

export const mockData = {
  tasks,
  financeStats,
  transactions,
  journalEntries,
};
