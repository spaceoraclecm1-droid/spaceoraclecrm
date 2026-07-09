-- ============================================================
-- 99acres Integration — Supabase schema + RLS
-- ============================================================
-- Run this once in the Supabase SQL editor (or via psql) BEFORE
-- pointing the 99acres team at your webhook URL.
--
-- Tables touched:
--   * integration_logs  (new — created here)
--   * enquiries         (existing — gets two new columns; safe if rerun)
-- ============================================================

-- 1) integration_logs table
create table if not exists public.integration_logs (
  id                uuid primary key default gen_random_uuid(),
  integration_name  text not null,
  method            text not null,
  endpoint          text not null,
  status_code       integer not null,
  response_body     text,
  request_body      text,
  request_headers   jsonb,
  lead_name         text,
  phone             text,
  project           text,
  source            text,
  ip_address        text,
  response_time_ms  integer,
  error_message     text,
  created_at        timestamptz not null default now()
);

create index if not exists integration_logs_name_created_idx
  on public.integration_logs (integration_name, created_at desc);

-- 2) Add a raw-payload column to enquiries for debugging Housing/99acres drift.
-- Safe if it already exists.
alter table public.enquiries
  add column if not exists "99acres_raw_payload" text;

-- 3) RLS
-- Goal: anyone with the anon key cannot read integration logs.
-- The webhook POST writes via service-role from a future server client,
-- and the settings page reads via the same service-role. Public anon traffic
-- is rejected.
alter table public.integration_logs enable row level security;

drop policy if exists "anon read 99acres logs" on public.integration_logs;
drop policy if exists "anon insert 99acres logs" on public.integration_logs;

-- For demo/integration-testing only: a permissive policy lets the anon key
-- insert + select. BEFORE PRODUCTION, replace these with auth.uid()-gated
-- policies or move both directions through a service-role server client.
create policy "anon read 99acres logs"
  on public.integration_logs
  for select
  to anon
  using (integration_name = '99acres');

create policy "anon insert 99acres logs"
  on public.integration_logs
  for insert
  to anon
  with check (integration_name = '99acres');

-- ============================================================
-- The enquiry table gets new leads inserted by the webhook using
-- the anon key. RLS there is presumed already configured (see
-- existing enquiry insert policies). If not:
--
-- create policy "anon insert 99acres enquiry"
--   on public.enquiries for insert to anon with check ("Enquiry Source" = '99acres');
-- ============================================================
