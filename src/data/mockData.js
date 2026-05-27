export const tasks = [
  {
    id: "task-1",
    title: "Finalize Q4 Strategy Deck",
    dueLabel: "Today",
    timeLabel: "14:00",
    priority: "High",
    done: false,
  },
  {
    id: "task-2",
    title: "Review Engineering Specs",
    dueLabel: "Today",
    timeLabel: "16:30",
    priority: "Medium",
    done: false,
  },
  {
    id: "task-3",
    title: "Client Sync: Project Alpha",
    dueLabel: "Today",
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
    name: "Salary Credit",
    date: "2023-10-24",
    category: "income",
    type: "income",
    amount: 125000,
  },
  {
    id: "tx-2",
    name: "Cloud Infrastructure",
    date: "2023-10-23",
    category: "infra",
    type: "expense",
    amount: 18400,
  },
  {
    id: "tx-3",
    name: "Team Dinner",
    date: "2023-10-22",
    category: "food",
    type: "expense",
    amount: 4250,
  },
  {
    id: "tx-4",
    name: "Airport Transfer",
    date: "2023-10-21",
    category: "travel",
    type: "expense",
    amount: 1800,
  },
  {
    id: "tx-5",
    name: "Electricity Bill",
    date: "2023-10-20",
    category: "utility",
    type: "expense",
    amount: 6230,
  },
  {
    id: "tx-6",
    name: "Office Supplies",
    date: "2023-10-18",
    category: "infra",
    type: "expense",
    amount: 3100,
  },
];

export const journalEntries = [
  {
    id: "journal-1",
    dateLabel: "Oct 23",
    firstSentence:
      "The restructuring seems to be taking effect faster than anticipated. Need to monitor team velocity over the next sprint...",
  },
];

export const mockData = {
  tasks,
  financeStats,
  transactions,
  journalEntries,
};
