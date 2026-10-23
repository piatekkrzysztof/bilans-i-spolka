-- Bilans & Spółka: leady z konfiguratora, outbox zdarzeń, konsultacje i umowy.
-- Zasada: anon i authenticated nie mają dostępu do danych osobowych. API zapisuje przez funkcje
-- SECURITY DEFINER wywoływane kluczem service_role wyłącznie po stronie serwera (ADR-005).

create type lead_status as enum (
  'new', 'pending_delivery', 'delivered',      -- obieg webhooka do n8n
  'consultation_booked', 'consultation_done',  -- Cal.com
  'contract_sent', 'contract_signed',          -- Documenso
  'lost'
);
create type lead_temperature as enum ('hot', 'cold');
create type lead_intent as enum ('pdf', 'consultation');

create table public.leads (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  status             lead_status not null default 'new',
  intent             lead_intent not null,
  temperature        lead_temperature not null,
  score              smallint not null,
  advisor_slug       text,

  quote_input        jsonb not null,
  quote_hash         text not null,
  quote              jsonb not null,
  price_list_version text not null,
  monthly_net        integer not null check (monthly_net > 0),  -- grosze

  situation          text not null check (situation in ('switching', 'starting', 'first-office')),
  start_when         text not null check (start_when in ('next-month', 'quarter', 'someday')),
  name               text not null check (char_length(name) between 2 and 80),
  email              text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone              text,
  message            text check (char_length(message) <= 1000),

  consent_contact    boolean not null check (consent_contact),
  consent_marketing  boolean not null default false,
  consent_ip         inet,
  consent_at         timestamptz not null default now(),

  purge_after        timestamptz not null
);

comment on column public.leads.purge_after is 'RODO: po tej dacie workflow retencji w n8n usuwa lead (domyślnie +12 mies.)';
comment on column public.leads.monthly_net is 'Cena miesięczna netto w groszach, przeliczona na serwerze z cennika price_list_version';

create index leads_dedup_idx on public.leads (email, quote_hash, created_at desc);
create index leads_pending_idx on public.leads (created_at) where status = 'pending_delivery';
create index leads_purge_idx on public.leads (purge_after);

-- Outbox i dziennik: każde przejście statusu zostawia ślad (audyt, debug workflow).
create table public.lead_events (
  id          bigint generated always as identity primary key,
  lead_id     uuid not null references public.leads (id) on delete cascade,
  type        text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index lead_events_lead_idx on public.lead_events (lead_id, created_at);

-- Idempotencja webhooków z Cal.com i Documenso: to samo zdarzenie przetwarzamy raz.
create table public.processed_webhooks (
  source       text not null,
  external_id  text not null,
  processed_at timestamptz not null default now(),
  primary key (source, external_id)
);

alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.processed_webhooks enable row level security;
-- Brak polityk = brak dostępu dla anon/authenticated. Dostęp ma tylko service_role.

-- ── Zapis leada + zdarzenie outbox w jednej transakcji ────────────────────
create or replace function public.create_lead(
  p_intent lead_intent,
  p_quote_input jsonb,
  p_quote_hash text,
  p_quote jsonb,
  p_price_list_version text,
  p_monthly_net integer,
  p_score smallint,
  p_temperature lead_temperature,
  p_advisor_slug text,
  p_situation text,
  p_start_when text,
  p_name text,
  p_email text,
  p_phone text,
  p_message text,
  p_consent_contact boolean,
  p_consent_marketing boolean,
  p_consent_ip inet,
  p_purge_after timestamptz
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.leads (
    intent, quote_input, quote_hash, quote, price_list_version, monthly_net, score, temperature, advisor_slug,
    situation, start_when, name, email, phone, message,
    consent_contact, consent_marketing, consent_ip, purge_after
  ) values (
    p_intent, p_quote_input, p_quote_hash, p_quote, p_price_list_version, p_monthly_net, p_score, p_temperature, p_advisor_slug,
    p_situation, p_start_when, p_name, lower(p_email), p_phone, p_message,
    p_consent_contact, p_consent_marketing, p_consent_ip, p_purge_after
  )
  returning id into v_id;

  insert into public.lead_events (lead_id, type, payload)
  values (v_id, 'lead.created', jsonb_build_object('price_list_version', p_price_list_version, 'temperature', p_temperature));

  return v_id;
end;
$$;

create or replace function public.mark_lead_delivery(p_id uuid, p_delivered boolean, p_detail jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.leads
     set status = case when p_delivered then 'delivered'::public.lead_status else 'pending_delivery'::public.lead_status end
   where id = p_id and status in ('new', 'pending_delivery');

  insert into public.lead_events (lead_id, type, payload)
  values (p_id, case when p_delivered then 'webhook.delivered' else 'webhook.failed' end, coalesce(p_detail, '{}'::jsonb));
end;
$$;

-- Przejścia statusu wywoływane przez n8n (Cal.com, Documenso). Idempotentne po (source, external_id).
create or replace function public.advance_lead(p_id uuid, p_status lead_status, p_source text, p_external_id text, p_detail jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.processed_webhooks (source, external_id) values (p_source, p_external_id)
  on conflict do nothing;
  if not found then
    return false;  -- duplikat zdarzenia - nic nie robimy
  end if;

  update public.leads set status = p_status where id = p_id;
  insert into public.lead_events (lead_id, type, payload)
  values (p_id, p_source || '.' || p_status::text, coalesce(p_detail, '{}'::jsonb));
  return true;
end;
$$;

-- Retencja RODO: wywoływana codziennie przez workflow w n8n. Leady z podpisaną umową przechodzą do CRM wcześniej.
create or replace function public.purge_expired_leads()
returns integer
language sql
security definer
set search_path = ''
as $$
  with deleted as (delete from public.leads where purge_after < now() returning 1)
  select count(*)::integer from deleted;
$$;

revoke all on function public.create_lead, public.mark_lead_delivery, public.advance_lead, public.purge_expired_leads from public, anon, authenticated;
grant execute on function public.create_lead, public.mark_lead_delivery, public.advance_lead, public.purge_expired_leads to service_role;
