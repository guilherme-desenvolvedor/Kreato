-- =====================================================================
-- Kreator — esquema do banco de dados (Supabase / PostgreSQL)
--
-- COMO USAR: abra o painel do Supabase > SQL Editor > New query,
-- cole TODO este arquivo e clique em "Run".
-- O script é idempotente: pode ser executado mais de uma vez sem erro.
--
-- Segurança: todas as tabelas usam Row Level Security (RLS). Cada usuário
-- só enxerga e altera as próprias linhas (user_id = auth.uid()).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Função utilitária: mantém updated_at sempre atualizado
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles: perfil do criador (1 linha por usuário do Auth)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  name                     text not null default '',
  handle                   text not null default '',
  niche                    text not null default '',
  bio                      text not null default '',
  avatar_url               text not null default '',
  target_posts_per_week    integer not null default 4  check (target_posts_per_week >= 0),
  target_scripts_per_month integer not null default 12 check (target_scripts_per_month >= 0),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ideas: banco de ideias
-- ---------------------------------------------------------------------
create table if not exists public.ideas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null,
  description text not null default '',
  category    text not null default 'Tecnologia',
  platform    text not null default 'Instagram',
  status      text not null default 'Nova',
  is_favorite boolean not null default false,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists ideas_user_created_idx on public.ideas (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- scripts: roteiros (gancho, corpo, CTA)
-- ---------------------------------------------------------------------
create table if not exists public.scripts (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title                text not null,
  platform             text not null default 'Instagram',
  format               text not null default 'Vídeo Curto (60s)',
  hook                 text not null default '',
  body                 text not null default '',
  cta                  text not null default '',
  notes                text not null default '',
  status               text not null default 'Rascunho',
  word_count           integer not null default 0,
  reading_time_minutes integer not null default 1,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists scripts_user_updated_idx on public.scripts (user_id, updated_at desc);

-- ---------------------------------------------------------------------
-- publications: calendário editorial (planejamento)
-- ---------------------------------------------------------------------
create table if not exists public.publications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title          text not null,
  platform       text not null default 'Instagram',
  scheduled_date date not null,
  scheduled_time time not null default '09:00',
  status         text not null default 'rascunho',
  category       text not null default 'Tecnologia',
  script_id      uuid references public.scripts (id) on delete set null,
  notes          text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists publications_user_date_idx on public.publications (user_id, scheduled_date);
create index if not exists publications_script_idx on public.publications (script_id);

-- ---------------------------------------------------------------------
-- library_items: biblioteca de referências e modelos
-- ---------------------------------------------------------------------
create table if not exists public.library_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title         text not null,
  category      text not null default 'Frases & Ganchos',
  type          text not null default 'text',
  thumbnail_url text,
  content       text not null default '',
  source_url    text,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists library_items_user_created_idx on public.library_items (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- ai_messages: histórico de conversa com a Krea
-- ---------------------------------------------------------------------
create table if not exists public.ai_messages (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role              text not null check (role in ('user', 'assistant')),
  text              text not null,
  action_type       text,
  generated_content jsonb,
  created_at        timestamptz not null default now()
);
create index if not exists ai_messages_user_created_idx on public.ai_messages (user_id, created_at);

-- ---------------------------------------------------------------------
-- Triggers de updated_at
-- ---------------------------------------------------------------------
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists ideas_set_updated_at on public.ideas;
create trigger ideas_set_updated_at before update on public.ideas
  for each row execute function public.set_updated_at();

drop trigger if exists scripts_set_updated_at on public.scripts;
create trigger scripts_set_updated_at before update on public.scripts
  for each row execute function public.set_updated_at();

drop trigger if exists publications_set_updated_at on public.publications;
create trigger publications_set_updated_at before update on public.publications
  for each row execute function public.set_updated_at();

drop trigger if exists library_items_set_updated_at on public.library_items;
create trigger library_items_set_updated_at before update on public.library_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Cria o perfil automaticamente quando um usuário se cadastra
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, handle, niche)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1), 'Criador'),
    '@' || split_part(new.email, '@', 1),
    'Criador Digital'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- A função só deve ser chamada pelo trigger, nunca pela API
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Perfis para usuários que já existiam antes deste script
insert into public.profiles (id, name, handle, niche)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), split_part(u.email, '@', 1), 'Criador'),
  '@' || split_part(u.email, '@', 1),
  'Criador Digital'
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.ideas         enable row level security;
alter table public.scripts       enable row level security;
alter table public.publications  enable row level security;
alter table public.library_items enable row level security;
alter table public.ai_messages   enable row level security;

-- profiles (chave é o próprio id do usuário)
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated
  using ((select auth.uid()) = id);

-- ideas
drop policy if exists "ideas_select_own" on public.ideas;
drop policy if exists "ideas_insert_own" on public.ideas;
drop policy if exists "ideas_update_own" on public.ideas;
drop policy if exists "ideas_delete_own" on public.ideas;
create policy "ideas_select_own" on public.ideas for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "ideas_insert_own" on public.ideas for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "ideas_update_own" on public.ideas for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ideas_delete_own" on public.ideas for delete to authenticated
  using ((select auth.uid()) = user_id);

-- scripts
drop policy if exists "scripts_select_own" on public.scripts;
drop policy if exists "scripts_insert_own" on public.scripts;
drop policy if exists "scripts_update_own" on public.scripts;
drop policy if exists "scripts_delete_own" on public.scripts;
create policy "scripts_select_own" on public.scripts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "scripts_insert_own" on public.scripts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "scripts_update_own" on public.scripts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "scripts_delete_own" on public.scripts for delete to authenticated
  using ((select auth.uid()) = user_id);

-- publications
drop policy if exists "publications_select_own" on public.publications;
drop policy if exists "publications_insert_own" on public.publications;
drop policy if exists "publications_update_own" on public.publications;
drop policy if exists "publications_delete_own" on public.publications;
create policy "publications_select_own" on public.publications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "publications_insert_own" on public.publications for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "publications_update_own" on public.publications for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "publications_delete_own" on public.publications for delete to authenticated
  using ((select auth.uid()) = user_id);

-- library_items
drop policy if exists "library_items_select_own" on public.library_items;
drop policy if exists "library_items_insert_own" on public.library_items;
drop policy if exists "library_items_update_own" on public.library_items;
drop policy if exists "library_items_delete_own" on public.library_items;
create policy "library_items_select_own" on public.library_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "library_items_insert_own" on public.library_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "library_items_update_own" on public.library_items for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "library_items_delete_own" on public.library_items for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ai_messages
drop policy if exists "ai_messages_select_own" on public.ai_messages;
drop policy if exists "ai_messages_insert_own" on public.ai_messages;
drop policy if exists "ai_messages_update_own" on public.ai_messages;
drop policy if exists "ai_messages_delete_own" on public.ai_messages;
create policy "ai_messages_select_own" on public.ai_messages for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "ai_messages_insert_own" on public.ai_messages for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "ai_messages_update_own" on public.ai_messages for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ai_messages_delete_own" on public.ai_messages for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- Permissões da API (somente usuários logados; anon não acessa nada)
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.profiles      to authenticated;
grant select, insert, update, delete on public.ideas         to authenticated;
grant select, insert, update, delete on public.scripts       to authenticated;
grant select, insert, update, delete on public.publications  to authenticated;
grant select, insert, update, delete on public.library_items to authenticated;
grant select, insert, update, delete on public.ai_messages   to authenticated;

-- =====================================================================
-- Sugestões & Roadmap (central de sugestões colaborativa)
-- Todos os usuários logados leem e votam; só o dono do projeto muda o
-- status (pelo painel do Supabase > Table Editor, coluna "status").
-- =====================================================================
create table if not exists public.suggestions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title         text not null check (char_length(title) between 3 and 200),
  description   text not null check (char_length(description) between 3 and 2000),
  category      text not null default 'feature' check (category in ('feature', 'ux', 'ai', 'integration', 'other')),
  status        text not null default 'analise' check (status in ('analise', 'planejado', 'em_progresso', 'concluido')),
  author_name   text not null default '' check (char_length(author_name) <= 120),
  author_handle text not null default '' check (char_length(author_handle) <= 120),
  created_at    timestamptz not null default now()
);
create index if not exists suggestions_created_idx on public.suggestions (created_at desc);

create table if not exists public.suggestion_votes (
  suggestion_id uuid not null references public.suggestions (id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (suggestion_id, user_id)
);
create index if not exists suggestion_votes_user_idx on public.suggestion_votes (user_id);

-- O autor de uma sugestão já entra com 1 voto
create or replace function public.vote_for_own_suggestion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.suggestion_votes (suggestion_id, user_id)
  values (new.id, new.user_id)
  on conflict do nothing;
  return new;
end;
$$;
revoke execute on function public.vote_for_own_suggestion() from public, anon, authenticated;

drop trigger if exists suggestions_vote_for_author on public.suggestions;
create trigger suggestions_vote_for_author
  after insert on public.suggestions
  for each row execute function public.vote_for_own_suggestion();

alter table public.suggestions      enable row level security;
alter table public.suggestion_votes enable row level security;

drop policy if exists "suggestions_select_all" on public.suggestions;
drop policy if exists "suggestions_insert_own" on public.suggestions;
create policy "suggestions_select_all" on public.suggestions for select to authenticated
  using (true);
-- Só pode criar como si mesmo e sempre com status "analise"
create policy "suggestions_insert_own" on public.suggestions for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'analise');

drop policy if exists "suggestion_votes_select_all" on public.suggestion_votes;
drop policy if exists "suggestion_votes_insert_own" on public.suggestion_votes;
create policy "suggestion_votes_select_all" on public.suggestion_votes for select to authenticated
  using (true);
create policy "suggestion_votes_insert_own" on public.suggestion_votes for insert to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert on public.suggestions      to authenticated;
grant select, insert on public.suggestion_votes to authenticated;
