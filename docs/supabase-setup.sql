-- Supabase project
-- Project name: personal-os
-- Region: choose the closest region to your users
-- Database password: generate and store securely

create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  project text,
  due_label text,
  time_label text,
  priority text,
  "column" text,
  done boolean default false,
  estimate text,
  created_at timestamptz default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date text,
  name text not null,
  note text,
  category text,
  amount numeric not null,
  type text,
  created_at timestamptz default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  weekday text,
  day text,
  month text,
  mood text,
  mood_tone text,
  title text,
  body text,
  written_at text,
  tags text[],
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;
alter table public.transactions enable row level security;
alter table public.journal_entries enable row level security;

create policy "tasks_select_own"
  on public.tasks for select
  using (user_id = auth.uid());

create policy "tasks_insert_own"
  on public.tasks for insert
  with check (user_id = auth.uid());

create policy "tasks_update_own"
  on public.tasks for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "tasks_delete_own"
  on public.tasks for delete
  using (user_id = auth.uid());

create policy "transactions_select_own"
  on public.transactions for select
  using (user_id = auth.uid());

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (user_id = auth.uid());

create policy "transactions_update_own"
  on public.transactions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "transactions_delete_own"
  on public.transactions for delete
  using (user_id = auth.uid());

create policy "journal_entries_select_own"
  on public.journal_entries for select
  using (user_id = auth.uid());

create policy "journal_entries_insert_own"
  on public.journal_entries for insert
  with check (user_id = auth.uid());

create policy "journal_entries_update_own"
  on public.journal_entries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "journal_entries_delete_own"
  on public.journal_entries for delete
  using (user_id = auth.uid());

-- MVP user_id shortcut
-- MOCK_USER_ID: 7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3

insert into public.tasks
  (user_id, title, project, due_label, time_label, priority, "column", done, estimate)
values
  ('7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3', 'Review May budget', 'Finance', 'Today', '10:00', 'High', 'todo', false, '45m'),
  ('7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3', 'Renew health insurance', 'Admin', 'Today', '15:30', 'Medium', 'wip', false, '30m'),
  ('7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3', 'Plan grocery order', 'Home', 'Tomorrow', '18:00', 'Low', 'todo', false, '20m'),
  ('7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3', 'Check subscription renewals', 'Finance', 'Friday', '12:00', 'Medium', 'todo', false, '25m'),
  ('7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3', 'Archive utility receipts', 'Finance', 'Yesterday', '19:00', 'Low', 'done', true, '15m');

insert into public.transactions
  (user_id, date, name, note, category, amount, type)
values
  ('7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3', '2026-05-28', 'Consulting Payment', 'Monthly income', 'income', 85000, 'income'),
  ('7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3', '2026-05-27', 'Rent', 'Monthly housing', 'utility', 28000, 'expense'),
  ('7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3', '2026-05-26', 'Groceries', 'Weekly essentials', 'food', 3620, 'expense'),
  ('7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3', '2026-05-25', 'Metro Card Reload', 'Commute balance', 'travel', 1200, 'expense'),
  ('7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3', '2026-05-24', 'Freelance Deposit', 'Side project income', 'income', 18000, 'income');

insert into public.journal_entries
  (user_id, weekday, day, month, mood, mood_tone, title, body, written_at, tags)
values
  ('7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3', 'Thursday', '28', 'May', 'Focused', 'positive', 'Execution Notes', 'The operating rhythm is starting to feel sharper. The main move tomorrow is to reduce open loops and protect deep work before the afternoon calls.', '2026-05-28T09:30:00+05:30', array['ops', 'focus']),
  ('7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3', 'Wednesday', '27', 'May', 'Steady', 'neutral', 'Strategy Debrief', 'The strategy review surfaced two useful constraints: simplify the near-term roadmap and move ambiguous bets into explicit experiments.', '2026-05-27T21:15:00+05:30', array['strategy']),
  ('7f0c3d2e-4a95-4eb7-9b4f-6d28a1c7e9a3', 'Tuesday', '26', 'May', 'Tired', 'reflective', 'System Reset', 'Energy dipped after lunch, but the reset worked. Tomorrow needs fewer context switches and a cleaner start block.', '2026-05-26T20:45:00+05:30', array['health', 'planning']);
