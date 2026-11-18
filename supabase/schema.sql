-- Table des réservations et des demandes de privatisation pour Beehive Club.
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run.
-- Le script peut être relancé sans risque (il met aussi à jour une table existante).

create extension if not exists pgcrypto;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  reservation_date date not null,
  reservation_time text not null check (reservation_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  guests integer not null,
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) between 8 and 24),
  email text,
  occasion text,
  message text check (message is null or char_length(message) <= 1000),
  locale text not null default 'fr' check (locale in ('fr', 'en')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined'))
);

-- Privatisations : type d'événement, formule, entreprise.
alter table public.reservations add column if not exists kind text not null default 'table';
alter table public.reservations add column if not exists event_type text;
alter table public.reservations add column if not exists event_space text;
alter table public.reservations add column if not exists company text;

alter table public.reservations drop constraint if exists reservations_kind_check;
alter table public.reservations add constraint reservations_kind_check check (kind in ('table', 'event'));

-- Tables : 1 à 12 personnes ; privatisations : jusqu'à 300 invités.
alter table public.reservations drop constraint if exists reservations_guests_check;
alter table public.reservations add constraint reservations_guests_check check (guests between 1 and 300);

alter table public.reservations drop constraint if exists reservations_message_check;
alter table public.reservations add constraint reservations_message_check
  check (message is null or char_length(message) <= 1000);

create index if not exists reservations_date_idx on public.reservations (reservation_date, reservation_time);

-- Sécurité : aucune règle publique. Seul le serveur du site (clé service_role,
-- jamais exposée au navigateur) peut lire et écrire.
alter table public.reservations enable row level security;

-- Visites de la démo privée (seulement quand DEMO_PASSWORD est défini) :
-- pour savoir si le lien envoyé a été ouvert, quand et quelles pages ont été vues.
-- Aucune adresse IP n'est enregistrée.
create table if not exists public.demo_visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null,
  kind text not null check (kind in ('lien', 'page', 'apercu')),
  device text,
  browser text,
  city text,
  country text
);

create index if not exists demo_visits_created_idx on public.demo_visits (created_at desc);

alter table public.demo_visits enable row level security;
