CREATE TABLE "audit_log" (
  "id" bigserial PRIMARY KEY,
  "table_name" varchar(80) NOT NULL,
  "record_id" int NOT NULL,
  "operation" varchar(10) NOT NULL,
  "changed_by" int,
  "changed_at" timestamptz NOT NULL DEFAULT (now()),
  "old_data" text
);

CREATE TABLE "department" (
  "id" serial PRIMARY KEY,
  "name" varchar(100) NOT NULL
);

CREATE TABLE "city" (
  "id" serial PRIMARY KEY,
  "id_department" int NOT NULL,
  "name" varchar(100) NOT NULL
);

CREATE TABLE "church" (
  "id" serial PRIMARY KEY,
  "id_city" int,
  "name" varchar(100) NOT NULL,
  "rtn" varchar(14),
  "contact_phone" varchar(14),
  "founder_name" varchar(60),
  "mission" text,
  "vision" text,
  "values" text,
  "foundation_date" date,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "event_type" (
  "id" serial PRIMARY KEY,
  "name" varchar(80) UNIQUE NOT NULL,
  "event_category" varchar[50]
);

CREATE TABLE "transaction_category" (
  "id" serial PRIMARY KEY,
  "name" varchar(80) NOT NULL,
  "type" varchar(10) NOT NULL,
  "active" boolean DEFAULT true
);

CREATE TABLE "member_role_type" (
  "id" serial PRIMARY KEY,
  "name" varchar(80) NOT NULL,
  "belongs_to" varchar(30),
  "active" boolean DEFAULT true
);

CREATE TABLE "user_role" (
  "id" serial PRIMARY KEY,
  "name" varchar(80) UNIQUE NOT NULL,
  "description" text,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "permission" (
  "id" serial PRIMARY KEY,
  "code" varchar(50) UNIQUE NOT NULL,
  "description" varchar(150) NOT NULL,
  "active" boolean DEFAULT true
);

CREATE TABLE "role_permission" (
  "id_user_role" int,
  "id_permission" int,
  "created_at" timestamptz DEFAULT (now()),
  PRIMARY KEY ("id_user_role", "id_permission")
);

CREATE TABLE "user" (
  "id" serial PRIMARY KEY,
  "id_church" int,
  "id_member" int,
  "email" varchar(100) UNIQUE NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "active" boolean DEFAULT true,
  "id_user_role" int,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "member" (
  "id" serial PRIMARY KEY,
  "id_church" int NOT NULL,
  "name" varchar(60) NOT NULL,
  "document_type" varchar(30) NOT NULL,
  "document_number" varchar(30) NOT NULL,
  "profession" varchar(100),
  "birth_date" date NOT NULL,
  "phone" varchar(20),
  "personal_email" varchar(100),
  "address" text,
  "baptism_date" date,
  "join_date" date NOT NULL,
  "active" boolean DEFAULT true,
  "inactivated_at" date,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "ministry" (
  "id" serial PRIMARY KEY,
  "id_church" int NOT NULL,
  "code" varchar(20) NOT NULL,
  "name" varchar(100) NOT NULL,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "board" (
  "id" serial PRIMARY KEY,
  "id_church" int NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" text,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "board_member" (
  "id" serial PRIMARY KEY,
  "id_member" int NOT NULL,
  "assignment_type" varchar(20) NOT NULL,
  "id_board" int,
  "id_member_role_type" int NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "ministry_member" (
  "id" serial PRIMARY KEY,
  "id_member" int NOT NULL,
  "assignment_type" varchar(20) NOT NULL,
  "id_ministry" int,
  "id_member_role_type" int NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "article" (
  "id" serial PRIMARY KEY,
  "id_church" int NOT NULL,
  "code" varchar(30) NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" varchar(200),
  "brand" varchar(80),
  "model" varchar(80),
  "unit_cost" decimal(12,2) NOT NULL,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "inventory_movement" (
  "id" serial PRIMARY KEY,
  "id_church" int NOT NULL,
  "type" varchar(10) NOT NULL,
  "document_number" varchar(30),
  "datetime" timestamptz NOT NULL,
  "id_user" int,
  "id_article" int NOT NULL,
  "quantity" decimal(10,2) NOT NULL,
  "notes" text,
  "created_at" timestamptz DEFAULT (now())
);

CREATE TABLE "event" (
  "id" serial PRIMARY KEY,
  "id_church" int NOT NULL,
  "id_event_type" int,
  "id_ministry" int,
  "title" varchar(100) NOT NULL,
  "description" text,
  "location" varchar(200),
  "estimated_budget" decimal(12,2),
  "is_recurrent" boolean NOT NULL,
  "frequency" varchar(20),
  "day_of_week" varchar(15),
  "recurrence_end_date" date,
  "start_datetime" timestamptz NOT NULL,
  "end_datetime" timestamptz NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'Planned',
  "cancel_reason" text,
  "cancelled_at" timestamptz,
  "cancelled_by" int,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "event_responsible_member" (
  "id" serial PRIMARY KEY,
  "id_event" int NOT NULL,
  "id_member" int NOT NULL
);

CREATE TABLE "member_event" (
  "id" serial PRIMARY KEY,
  "id_event" int NOT NULL,
  "id_member" int NOT NULL,
  "attended" boolean DEFAULT false,
  "notes" text,
  "created_at" timestamptz DEFAULT (now())
);

CREATE TABLE "trip_detail" (
  "id" serial PRIMARY KEY,
  "id_event" int UNIQUE NOT NULL,
  "origin" varchar(200) NOT NULL,
  "destination" varchar(200) NOT NULL,
  "notes" text
);

CREATE TABLE "fundraising_detail" (
  "id" serial PRIMARY KEY,
  "id_event" int UNIQUE NOT NULL,
  "target_amount" decimal(12,2),
  "notes" text
);

CREATE TABLE "financial_transaction" (
  "id" serial PRIMARY KEY,
  "id_church" int NOT NULL,
  "id_category" int NOT NULL,
  "amount" decimal(12,2) NOT NULL,
  "description" varchar(200) NOT NULL,
  "transaction_date" date NOT NULL,
  "payment_method" varchar(20),
  "receipt_type" varchar(20),
  "receipt_number" varchar(50),
  "notes" text,
  "id_event" int,
  "id_ministry" int,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "financial_report" (
  "id" serial PRIMARY KEY,
  "id_church" int NOT NULL,
  "id_ministry" int,
  "report_type" varchar(20) NOT NULL DEFAULT 'annual',
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "title" varchar(100) NOT NULL,
  "summary" text,
  "total_income" decimal(12,2) NOT NULL DEFAULT 0,
  "total_expenses" decimal(12,2) NOT NULL DEFAULT 0,
  "net_result" decimal(12,2) NOT NULL DEFAULT 0,
  "status" varchar(20) NOT NULL DEFAULT 'Draft',
  "presented_at" timestamptz,
  "presented_by" int,
  "approved_at" timestamptz,
  "approved_by" int,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "period_closure" (
  "id" serial PRIMARY KEY,
  "id_church" int NOT NULL,
  "year" int NOT NULL,
  "own_funds" decimal(12,2) NOT NULL,
  "accumulated_reserve" decimal(12,2) NOT NULL,
  "closure_date" date,
  "notes" text,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "budget" (
  "id" serial PRIMARY KEY,
  "id_church" int NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "description" text,
  "status" varchar(20) NOT NULL DEFAULT 'Draft',
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE TABLE "budget_category" (
  "id" serial PRIMARY KEY,
  "id_budget" int NOT NULL,
  "id_category" int NOT NULL,
  "annual_amount" decimal(12,2) NOT NULL,
  "notes" text
);

CREATE TABLE "budget_distribution" (
  "id" serial PRIMARY KEY,
  "id_budget" int NOT NULL,
  "id_ministry" int NOT NULL,
  "percentage" decimal(5,2) NOT NULL,
  "created_at" timestamptz DEFAULT (now()),
  "created_by" int
);

CREATE INDEX ON "audit_log" ("table_name", "record_id");

CREATE INDEX ON "audit_log" ("changed_at");

CREATE INDEX ON "audit_log" ("changed_by");

CREATE UNIQUE INDEX ON "transaction_category" ("name", "type");

CREATE UNIQUE INDEX ON "member" ("document_type", "document_number");

CREATE UNIQUE INDEX ON "ministry" ("id_church", "code");

CREATE INDEX ON "board_member" ("id_member");

CREATE INDEX ON "board_member" ("assignment_type");

CREATE INDEX ON "board_member" ("id_member", "id_board", "active");

CREATE INDEX ON "ministry_member" ("id_member");

CREATE INDEX ON "ministry_member" ("assignment_type");

CREATE INDEX ON "ministry_member" ("id_member", "id_ministry", "active");

CREATE UNIQUE INDEX ON "article" ("id_church", "code");

CREATE INDEX ON "event" ("id_church", "start_datetime");

CREATE INDEX ON "event" ("id_ministry");

CREATE INDEX ON "event" ("status");

CREATE UNIQUE INDEX ON "event_responsible_member" ("id_event", "id_member");

CREATE UNIQUE INDEX ON "member_event" ("id_event", "id_member");

CREATE INDEX ON "financial_transaction" ("id_church", "transaction_date");

CREATE INDEX ON "financial_transaction" ("id_category");

CREATE INDEX ON "financial_transaction" ("id_event");

CREATE INDEX ON "financial_transaction" ("id_ministry");

CREATE INDEX ON "financial_report" ("id_church", "period_start", "period_end");

CREATE INDEX ON "financial_report" ("id_ministry");

CREATE INDEX ON "financial_report" ("status");

CREATE UNIQUE INDEX ON "period_closure" ("id_church", "year");

CREATE UNIQUE INDEX ON "budget" ("id_church", "period_start", "period_end");

CREATE UNIQUE INDEX ON "budget_category" ("id_budget", "id_category");

CREATE UNIQUE INDEX ON "budget_distribution" ("id_budget", "id_ministry");

COMMENT ON COLUMN "audit_log"."operation" IS 'CHECK (''INSERT'',''UPDATE'',''DELETE'')';

COMMENT ON COLUMN "audit_log"."changed_by" IS 'NULL if background process';

COMMENT ON COLUMN "church"."active" IS 'Soft-delete';

COMMENT ON COLUMN "event_type"."name" IS 'Culto, Escuela Dominical, Reunion, Retiro, Conferencia, Barbacoa, Viaje, etc.';

COMMENT ON COLUMN "event_type"."event_category" IS 'CHECK (''calendar_event'', ''trip'', ''fundraising'')';

COMMENT ON COLUMN "transaction_category"."type" IS 'CHECK (''income'',''expense'')';

COMMENT ON COLUMN "transaction_category"."active" IS 'Soft-delete';

COMMENT ON COLUMN "member_role_type"."belongs_to" IS 'CHECK (''Council'', ''Ministry'')';

COMMENT ON COLUMN "member_role_type"."active" IS 'Soft-delete';

COMMENT ON COLUMN "user_role"."active" IS 'Soft-delete';

COMMENT ON COLUMN "permission"."active" IS 'Soft-delete';

COMMENT ON COLUMN "user"."active" IS 'Soft-delete';

COMMENT ON COLUMN "member"."document_type" IS 'CHECK (''National ID'',''Passport'',''Birth Certificate'')';

COMMENT ON COLUMN "member"."active" IS 'Soft-delete';

COMMENT ON COLUMN "member"."inactivated_at" IS 'When member was marked inactive';

COMMENT ON COLUMN "ministry"."active" IS 'Soft-delete';

COMMENT ON TABLE "board" IS 'Only one active board at a time per church';

COMMENT ON COLUMN "board"."active" IS 'Soft-delete. Only one active board per church.';

COMMENT ON COLUMN "board_member"."assignment_type" IS 'CHECK (''ministry'',''board'')';

COMMENT ON COLUMN "board_member"."active" IS 'Soft-delete';

COMMENT ON COLUMN "ministry_member"."assignment_type" IS 'CHECK (''ministry'',''board'')';

COMMENT ON COLUMN "ministry_member"."active" IS 'Soft-delete';

COMMENT ON COLUMN "article"."active" IS 'Soft-delete';

COMMENT ON COLUMN "inventory_movement"."type" IS 'CHECK (''Inbound'',''Outbound'')';

COMMENT ON COLUMN "event"."id_ministry" IS 'NULL = church-wide event';

COMMENT ON COLUMN "event"."estimated_budget" IS 'Optional for special events';

COMMENT ON COLUMN "event"."frequency" IS 'CHECK (''daily'',''weekly'',''biweekly'',''monthly''). NULL when is_recurrent=false';

COMMENT ON COLUMN "event"."day_of_week" IS 'NULL for non-weekly frequencies';

COMMENT ON COLUMN "event"."recurrence_end_date" IS 'NULL = indefinite recurrence';

COMMENT ON COLUMN "event"."status" IS 'CHECK (''Planned'',''In Progress'',''Completed'',''Cancelled''). Uses status instead of soft-delete.';

COMMENT ON COLUMN "trip_detail"."id_event" IS 'Solo si event_category=trip';

COMMENT ON COLUMN "fundraising_detail"."id_event" IS 'Solo si event_category=fundraising';

COMMENT ON COLUMN "fundraising_detail"."target_amount" IS 'Goal to raise';

COMMENT ON COLUMN "financial_transaction"."id_category" IS 'Category determines income/expense type';

COMMENT ON COLUMN "financial_transaction"."payment_method" IS 'CHECK (''Cash'',''Transfer'',''Check'',''Card'')';

COMMENT ON COLUMN "financial_transaction"."receipt_type" IS 'CHECK (''Receipt'',''Invoice'',''Certificate'',''Note'',''Other'')';

COMMENT ON COLUMN "financial_transaction"."receipt_number" IS 'Invoice/receipt number if applicable';

COMMENT ON COLUMN "financial_transaction"."id_event" IS 'Optional: link to fundraising or trip event';

COMMENT ON COLUMN "financial_transaction"."id_ministry" IS 'NULL = church general funds. NOT NULL = ministry-specific funds';

COMMENT ON COLUMN "financial_transaction"."created_by" IS 'Administradora who registered it';

COMMENT ON COLUMN "financial_report"."id_ministry" IS 'NULL = church-wide report. NOT NULL = ministry report';

COMMENT ON COLUMN "financial_report"."report_type" IS 'CHECK (''annual'',''quarterly'',''monthly'')';

COMMENT ON COLUMN "financial_report"."total_income" IS 'Frozen snapshot when status=Approved';

COMMENT ON COLUMN "financial_report"."total_expenses" IS 'Frozen snapshot when status=Approved';

COMMENT ON COLUMN "financial_report"."net_result" IS 'Frozen snapshot when status=Approved';

COMMENT ON COLUMN "financial_report"."status" IS 'CHECK (''Draft'',''Presented'',''Approved'')';

COMMENT ON COLUMN "financial_report"."presented_at" IS 'When presented to concilio/iglesia';

COMMENT ON COLUMN "financial_report"."presented_by" IS 'Administradora who presented it';

COMMENT ON COLUMN "period_closure"."own_funds" IS 'Caja chica + cuenta corriente operativa';

COMMENT ON COLUMN "period_closure"."accumulated_reserve" IS 'Ahorros historicos para emergencias o proyectos';

COMMENT ON COLUMN "budget"."period_start" IS 'Always January 1st of the year';

COMMENT ON COLUMN "budget"."period_end" IS 'Always December 31st of the year';

COMMENT ON COLUMN "budget"."status" IS 'CHECK (''Draft'',''Active'',''Closed'')';

COMMENT ON COLUMN "budget_category"."annual_amount" IS 'Budgeted amount for the year';

COMMENT ON COLUMN "budget_distribution"."percentage" IS 'Active distribution must sum to 100.00';

ALTER TABLE "audit_log" ADD FOREIGN KEY ("changed_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "city" ADD FOREIGN KEY ("id_department") REFERENCES "department" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "church" ADD FOREIGN KEY ("id_city") REFERENCES "city" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "church" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_role" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "role_permission" ADD FOREIGN KEY ("id_user_role") REFERENCES "user_role" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "role_permission" ADD FOREIGN KEY ("id_permission") REFERENCES "permission" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user" ADD FOREIGN KEY ("id_church") REFERENCES "church" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user" ADD FOREIGN KEY ("id_member") REFERENCES "member" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user" ADD FOREIGN KEY ("id_user_role") REFERENCES "user_role" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "member" ADD FOREIGN KEY ("id_church") REFERENCES "church" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "member" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ministry" ADD FOREIGN KEY ("id_church") REFERENCES "church" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ministry" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "board" ADD FOREIGN KEY ("id_church") REFERENCES "church" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "board" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "board_member" ADD FOREIGN KEY ("id_member") REFERENCES "member" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "board_member" ADD FOREIGN KEY ("id_board") REFERENCES "board" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "board_member" ADD FOREIGN KEY ("id_member_role_type") REFERENCES "member_role_type" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "board_member" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ministry_member" ADD FOREIGN KEY ("id_member") REFERENCES "member" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ministry_member" ADD FOREIGN KEY ("id_ministry") REFERENCES "ministry" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ministry_member" ADD FOREIGN KEY ("id_member_role_type") REFERENCES "member_role_type" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ministry_member" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article" ADD FOREIGN KEY ("id_church") REFERENCES "church" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inventory_movement" ADD FOREIGN KEY ("id_church") REFERENCES "church" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inventory_movement" ADD FOREIGN KEY ("id_user") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inventory_movement" ADD FOREIGN KEY ("id_article") REFERENCES "article" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "event" ADD FOREIGN KEY ("id_church") REFERENCES "church" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "event" ADD FOREIGN KEY ("id_event_type") REFERENCES "event_type" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "event" ADD FOREIGN KEY ("id_ministry") REFERENCES "ministry" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "event" ADD FOREIGN KEY ("cancelled_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "event" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "event_responsible_member" ADD FOREIGN KEY ("id_event") REFERENCES "event" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "event_responsible_member" ADD FOREIGN KEY ("id_member") REFERENCES "member" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "member_event" ADD FOREIGN KEY ("id_event") REFERENCES "event" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "member_event" ADD FOREIGN KEY ("id_member") REFERENCES "member" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "trip_detail" ADD FOREIGN KEY ("id_event") REFERENCES "event" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "fundraising_detail" ADD FOREIGN KEY ("id_event") REFERENCES "event" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "financial_transaction" ADD FOREIGN KEY ("id_church") REFERENCES "church" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "financial_transaction" ADD FOREIGN KEY ("id_category") REFERENCES "transaction_category" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "financial_transaction" ADD FOREIGN KEY ("id_event") REFERENCES "event" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "financial_transaction" ADD FOREIGN KEY ("id_ministry") REFERENCES "ministry" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "financial_transaction" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "financial_report" ADD FOREIGN KEY ("id_church") REFERENCES "church" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "financial_report" ADD FOREIGN KEY ("id_ministry") REFERENCES "ministry" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "financial_report" ADD FOREIGN KEY ("presented_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "financial_report" ADD FOREIGN KEY ("approved_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "financial_report" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "period_closure" ADD FOREIGN KEY ("id_church") REFERENCES "church" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "period_closure" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "budget" ADD FOREIGN KEY ("id_church") REFERENCES "church" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "budget" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "budget_category" ADD FOREIGN KEY ("id_budget") REFERENCES "budget" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "budget_category" ADD FOREIGN KEY ("id_category") REFERENCES "transaction_category" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "budget_distribution" ADD FOREIGN KEY ("id_budget") REFERENCES "budget" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "budget_distribution" ADD FOREIGN KEY ("id_ministry") REFERENCES "ministry" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "budget_distribution" ADD FOREIGN KEY ("created_by") REFERENCES "user" ("id") DEFERRABLE INITIALLY IMMEDIATE;
