-- Tracks the highest threshold tier (0, 80, 100) already emailed for each
-- budget/goal so the daily cron job does not resend the same alert every run.
alter table public.budgets
  add column if not exists last_alert_percent integer not null default 0;

alter table public.goals
  add column if not exists last_alert_percent integer not null default 0;
