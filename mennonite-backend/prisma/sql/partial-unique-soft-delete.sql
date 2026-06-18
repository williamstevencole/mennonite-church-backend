-- Partial unique indexes for soft-deletable tables.
--
-- WHY: Schema-level @@unique constraints reject re-insertion of a row whose
-- key was previously soft-deleted (active=false). These partial unique
-- indexes restrict uniqueness to currently-active rows, so a soft-deleted
-- row never blocks a new active one with the same key.
--
-- HOW TO APPLY:
--   1. Sync the schema first so the regular @@index versions exist:
--        npx prisma migrate dev --name soft_delete_columns_and_indexes
--      (or `npx prisma db push` if you don't use migrations yet).
--   2. Then apply this SQL once:
--        npx prisma db execute --file prisma/sql/partial-unique-soft-delete.sql --schema prisma/schema.prisma
--      (or pipe it into psql against $DATABASE_URL).
--
-- All statements are idempotent (IF NOT EXISTS), so re-applying is safe.

-- Catalogs scoped to a church
CREATE UNIQUE INDEX IF NOT EXISTS event_type_church_name_active_key
  ON event_type (id_church, name) WHERE active = true;

CREATE UNIQUE INDEX IF NOT EXISTS transaction_category_church_name_type_active_key
  ON transaction_category (id_church, name, type) WHERE active = true;

CREATE UNIQUE INDEX IF NOT EXISTS user_role_church_name_active_key
  ON user_role (id_church, name) WHERE active = true;

CREATE UNIQUE INDEX IF NOT EXISTS ministry_church_name_active_key
  ON ministry (id_church, name) WHERE active = true;

CREATE UNIQUE INDEX IF NOT EXISTS board_church_name_active_key
  ON board (id_church, name) WHERE active = true;

-- Business rule: at most one active board per church (see model comment).
CREATE UNIQUE INDEX IF NOT EXISTS board_one_active_per_church
  ON board (id_church) WHERE active = true;

CREATE UNIQUE INDEX IF NOT EXISTS article_church_code_active_key
  ON article (id_church, code) WHERE active = true;

-- Catalogs scoped to a parent (ministry / board)
CREATE UNIQUE INDEX IF NOT EXISTS ministry_role_type_ministry_name_active_key
  ON ministry_role_type (id_ministry, name) WHERE active = true;

CREATE UNIQUE INDEX IF NOT EXISTS board_role_type_board_name_active_key
  ON board_role_type (id_board, name) WHERE active = true;

-- Financial period / budget keys (one active per church-year / church-period)
CREATE UNIQUE INDEX IF NOT EXISTS period_closure_church_year_active_key
  ON period_closure (id_church, year) WHERE active = true;

CREATE UNIQUE INDEX IF NOT EXISTS budget_church_period_active_key
  ON budget (id_church, period_start, period_end) WHERE active = true;

CREATE UNIQUE INDEX IF NOT EXISTS budget_category_budget_category_active_key
  ON budget_category (id_budget, id_category) WHERE active = true;

CREATE UNIQUE INDEX IF NOT EXISTS budget_distribution_budget_ministry_active_key
  ON budget_distribution (id_budget, id_ministry) WHERE active = true;

-- Event ↔ member join tables (a single active row per (event, member) pair)
CREATE UNIQUE INDEX IF NOT EXISTS event_responsible_member_event_member_active_key
  ON event_responsible_member (id_event, id_member) WHERE active = true;

CREATE UNIQUE INDEX IF NOT EXISTS member_event_event_member_active_key
  ON member_event (id_event, id_member) WHERE active = true;
