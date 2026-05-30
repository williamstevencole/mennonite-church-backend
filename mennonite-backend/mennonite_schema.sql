-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.article (
  id integer NOT NULL DEFAULT nextval('article_id_seq'::regclass),
  id_church integer NOT NULL,
  code character varying NOT NULL,
  name character varying NOT NULL,
  description character varying,
  brand character varying,
  model character varying,
  unit_cost numeric NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  CONSTRAINT article_pkey PRIMARY KEY (id),
  CONSTRAINT article_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id),
  CONSTRAINT article_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.audit_log (
  id bigint NOT NULL DEFAULT nextval('audit_log_id_seq'::regclass),
  table_name character varying NOT NULL,
  record_id integer NOT NULL,
  operation character varying NOT NULL,
  changed_by integer,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  old_data text,
  CONSTRAINT audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT audit_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.user(id)
);
CREATE TABLE public.board (
  id integer NOT NULL DEFAULT nextval('board_id_seq'::regclass),
  id_church integer NOT NULL,
  name character varying NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  CONSTRAINT board_pkey PRIMARY KEY (id),
  CONSTRAINT board_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id),
  CONSTRAINT board_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.board_member (
  id integer NOT NULL DEFAULT nextval('board_member_id_seq'::regclass),
  id_member integer NOT NULL,
  assignment_type character varying NOT NULL,
  id_board integer,
  id_member_role_type integer NOT NULL,
  start_date date NOT NULL,
  end_date date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  CONSTRAINT board_member_pkey PRIMARY KEY (id),
  CONSTRAINT board_member_id_member_fkey FOREIGN KEY (id_member) REFERENCES public.member(id),
  CONSTRAINT board_member_id_board_fkey FOREIGN KEY (id_board) REFERENCES public.board(id),
  CONSTRAINT board_member_id_member_role_type_fkey FOREIGN KEY (id_member_role_type) REFERENCES public.member_role_type(id),
  CONSTRAINT board_member_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.budget (
  id integer NOT NULL DEFAULT nextval('budget_id_seq'::regclass),
  id_church integer NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  description text,
  status character varying NOT NULL DEFAULT 'Draft'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  CONSTRAINT budget_pkey PRIMARY KEY (id),
  CONSTRAINT budget_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id),
  CONSTRAINT budget_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.budget_category (
  id integer NOT NULL DEFAULT nextval('budget_category_id_seq'::regclass),
  id_budget integer NOT NULL,
  id_category integer NOT NULL,
  annual_amount numeric NOT NULL,
  notes text,
  CONSTRAINT budget_category_pkey PRIMARY KEY (id),
  CONSTRAINT budget_category_id_budget_fkey FOREIGN KEY (id_budget) REFERENCES public.budget(id),
  CONSTRAINT budget_category_id_category_fkey FOREIGN KEY (id_category) REFERENCES public.transaction_category(id)
);
CREATE TABLE public.budget_distribution (
  id integer NOT NULL DEFAULT nextval('budget_distribution_id_seq'::regclass),
  id_budget integer NOT NULL,
  id_ministry integer NOT NULL,
  percentage numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  CONSTRAINT budget_distribution_pkey PRIMARY KEY (id),
  CONSTRAINT budget_distribution_id_budget_fkey FOREIGN KEY (id_budget) REFERENCES public.budget(id),
  CONSTRAINT budget_distribution_id_ministry_fkey FOREIGN KEY (id_ministry) REFERENCES public.ministry(id),
  CONSTRAINT budget_distribution_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.church (
  id integer NOT NULL DEFAULT nextval('church_id_seq'::regclass),
  id_city integer,
  name character varying NOT NULL,
  rtn character varying,
  contact_phone character varying,
  founder_name character varying,
  mission text,
  vision text,
  values text,
  foundation_date date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  CONSTRAINT church_pkey PRIMARY KEY (id),
  CONSTRAINT church_id_city_fkey FOREIGN KEY (id_city) REFERENCES public.city(id),
  CONSTRAINT church_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.city (
  id integer NOT NULL DEFAULT nextval('city_id_seq'::regclass),
  id_department integer NOT NULL,
  name character varying NOT NULL,
  CONSTRAINT city_pkey PRIMARY KEY (id),
  CONSTRAINT city_id_department_fkey FOREIGN KEY (id_department) REFERENCES public.department(id)
);
CREATE TABLE public.department (
  id integer NOT NULL DEFAULT nextval('department_id_seq'::regclass),
  name character varying NOT NULL,
  CONSTRAINT department_pkey PRIMARY KEY (id)
);
CREATE TABLE public.event (
  id integer NOT NULL DEFAULT nextval('event_id_seq'::regclass),
  id_church integer NOT NULL,
  id_event_type integer,
  id_ministry integer,
  title character varying NOT NULL,
  description text,
  location character varying,
  estimated_budget numeric,
  is_recurrent boolean NOT NULL,
  frequency character varying,
  day_of_week character varying,
  recurrence_end_date date,
  start_datetime timestamp with time zone NOT NULL,
  end_datetime timestamp with time zone NOT NULL,
  status character varying NOT NULL DEFAULT 'Planned'::character varying,
  cancel_reason text,
  cancelled_at timestamp with time zone,
  cancelled_by integer,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  CONSTRAINT event_pkey PRIMARY KEY (id),
  CONSTRAINT event_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id),
  CONSTRAINT event_id_event_type_fkey FOREIGN KEY (id_event_type) REFERENCES public.event_type(id),
  CONSTRAINT event_id_ministry_fkey FOREIGN KEY (id_ministry) REFERENCES public.ministry(id),
  CONSTRAINT event_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.user(id),
  CONSTRAINT event_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.event_responsible_member (
  id integer NOT NULL DEFAULT nextval('event_responsible_member_id_seq'::regclass),
  id_event integer NOT NULL,
  id_member integer NOT NULL,
  CONSTRAINT event_responsible_member_pkey PRIMARY KEY (id),
  CONSTRAINT event_responsible_member_id_event_fkey FOREIGN KEY (id_event) REFERENCES public.event(id),
  CONSTRAINT event_responsible_member_id_member_fkey FOREIGN KEY (id_member) REFERENCES public.member(id)
);
CREATE TABLE public.event_type (
  id integer NOT NULL DEFAULT nextval('event_type_id_seq'::regclass),
  name character varying NOT NULL,
  event_category character varying,
  id_church integer NOT NULL,
  CONSTRAINT event_type_pkey PRIMARY KEY (id),
  CONSTRAINT event_type_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id)
);
CREATE TABLE public.financial_report (
  id integer NOT NULL DEFAULT nextval('financial_report_id_seq'::regclass),
  id_church integer NOT NULL,
  id_ministry integer,
  report_type character varying NOT NULL DEFAULT 'annual'::character varying,
  period_start date NOT NULL,
  period_end date NOT NULL,
  title character varying NOT NULL,
  summary text,
  total_income numeric NOT NULL DEFAULT 0,
  total_expenses numeric NOT NULL DEFAULT 0,
  net_result numeric NOT NULL DEFAULT 0,
  status character varying NOT NULL DEFAULT 'Draft'::character varying,
  presented_at timestamp with time zone,
  presented_by integer,
  approved_at timestamp with time zone,
  approved_by integer,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  CONSTRAINT financial_report_pkey PRIMARY KEY (id),
  CONSTRAINT financial_report_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id),
  CONSTRAINT financial_report_id_ministry_fkey FOREIGN KEY (id_ministry) REFERENCES public.ministry(id),
  CONSTRAINT financial_report_presented_by_fkey FOREIGN KEY (presented_by) REFERENCES public.user(id),
  CONSTRAINT financial_report_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.user(id),
  CONSTRAINT financial_report_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.financial_transaction (
  id integer NOT NULL DEFAULT nextval('financial_transaction_id_seq'::regclass),
  id_church integer NOT NULL,
  id_category integer NOT NULL,
  amount numeric NOT NULL,
  description character varying NOT NULL,
  transaction_date date NOT NULL,
  payment_method character varying,
  receipt_type character varying,
  receipt_number character varying,
  notes text,
  id_event integer,
  id_ministry integer,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  CONSTRAINT financial_transaction_pkey PRIMARY KEY (id),
  CONSTRAINT financial_transaction_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id),
  CONSTRAINT financial_transaction_id_category_fkey FOREIGN KEY (id_category) REFERENCES public.transaction_category(id),
  CONSTRAINT financial_transaction_id_event_fkey FOREIGN KEY (id_event) REFERENCES public.event(id),
  CONSTRAINT financial_transaction_id_ministry_fkey FOREIGN KEY (id_ministry) REFERENCES public.ministry(id),
  CONSTRAINT financial_transaction_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.fundraising_detail (
  id integer NOT NULL DEFAULT nextval('fundraising_detail_id_seq'::regclass),
  id_event integer NOT NULL UNIQUE,
  target_amount numeric,
  notes text,
  CONSTRAINT fundraising_detail_pkey PRIMARY KEY (id),
  CONSTRAINT fundraising_detail_id_event_fkey FOREIGN KEY (id_event) REFERENCES public.event(id)
);
CREATE TABLE public.inventory_movement (
  id integer NOT NULL DEFAULT nextval('inventory_movement_id_seq'::regclass),
  id_church integer NOT NULL,
  type character varying NOT NULL,
  document_number character varying,
  datetime timestamp with time zone NOT NULL,
  id_user integer,
  id_article integer NOT NULL,
  quantity numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_movement_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_movement_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id),
  CONSTRAINT inventory_movement_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.user(id),
  CONSTRAINT inventory_movement_id_article_fkey FOREIGN KEY (id_article) REFERENCES public.article(id)
);
CREATE TABLE public.member (
  id integer NOT NULL DEFAULT nextval('member_id_seq'::regclass),
  id_church integer NOT NULL,
  name character varying NOT NULL,
  document_type character varying NOT NULL,
  document_number character varying NOT NULL,
  profession character varying,
  birth_date date NOT NULL,
  phone character varying,
  personal_email character varying,
  address text,
  baptism_date date,
  join_date date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  inactivated_at date,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  CONSTRAINT member_pkey PRIMARY KEY (id),
  CONSTRAINT member_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id),
  CONSTRAINT member_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.member_event (
  id integer NOT NULL DEFAULT nextval('member_event_id_seq'::regclass),
  id_event integer NOT NULL,
  id_member integer NOT NULL,
  attended boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT member_event_pkey PRIMARY KEY (id),
  CONSTRAINT member_event_id_event_fkey FOREIGN KEY (id_event) REFERENCES public.event(id),
  CONSTRAINT member_event_id_member_fkey FOREIGN KEY (id_member) REFERENCES public.member(id)
);
CREATE TABLE public.member_role_type (
  id integer NOT NULL DEFAULT nextval('member_role_type_id_seq'::regclass),
  name character varying NOT NULL,
  belongs_to character varying,
  active boolean NOT NULL DEFAULT true,
  id_church integer NOT NULL,
  CONSTRAINT member_role_type_pkey PRIMARY KEY (id),
  CONSTRAINT member_role_type_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id)
);
CREATE TABLE public.ministry (
  id integer NOT NULL DEFAULT nextval('ministry_id_seq'::regclass),
  id_church integer NOT NULL,
  code character varying NOT NULL,
  name character varying NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  CONSTRAINT ministry_pkey PRIMARY KEY (id),
  CONSTRAINT ministry_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id),
  CONSTRAINT ministry_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.ministry_member (
  id integer NOT NULL DEFAULT nextval('ministry_member_id_seq'::regclass),
  id_member integer NOT NULL,
  assignment_type character varying NOT NULL,
  id_ministry integer,
  id_member_role_type integer NOT NULL,
  start_date date NOT NULL,
  end_date date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  CONSTRAINT ministry_member_pkey PRIMARY KEY (id),
  CONSTRAINT ministry_member_id_member_fkey FOREIGN KEY (id_member) REFERENCES public.member(id),
  CONSTRAINT ministry_member_id_ministry_fkey FOREIGN KEY (id_ministry) REFERENCES public.ministry(id),
  CONSTRAINT ministry_member_id_member_role_type_fkey FOREIGN KEY (id_member_role_type) REFERENCES public.member_role_type(id),
  CONSTRAINT ministry_member_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.period_closure (
  id integer NOT NULL DEFAULT nextval('period_closure_id_seq'::regclass),
  id_church integer NOT NULL,
  year integer NOT NULL,
  own_funds numeric NOT NULL,
  accumulated_reserve numeric NOT NULL,
  closure_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  CONSTRAINT period_closure_pkey PRIMARY KEY (id),
  CONSTRAINT period_closure_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id),
  CONSTRAINT period_closure_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.permission (
  id integer NOT NULL DEFAULT nextval('permission_id_seq'::regclass),
  code character varying NOT NULL UNIQUE,
  description character varying NOT NULL,
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT permission_pkey PRIMARY KEY (id)
);
CREATE TABLE public.role_permission (
  id_user_role integer NOT NULL,
  id_permission integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT role_permission_pkey PRIMARY KEY (id_user_role, id_permission),
  CONSTRAINT role_permission_id_user_role_fkey FOREIGN KEY (id_user_role) REFERENCES public.user_role(id),
  CONSTRAINT role_permission_id_permission_fkey FOREIGN KEY (id_permission) REFERENCES public.permission(id)
);
CREATE TABLE public.transaction_category (
  id integer NOT NULL DEFAULT nextval('transaction_category_id_seq'::regclass),
  name character varying NOT NULL,
  type character varying NOT NULL,
  active boolean NOT NULL DEFAULT true,
  id_church integer NOT NULL,
  CONSTRAINT transaction_category_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_category_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id)
);
CREATE TABLE public.trip_detail (
  id integer NOT NULL DEFAULT nextval('trip_detail_id_seq'::regclass),
  id_event integer NOT NULL UNIQUE,
  origin character varying NOT NULL,
  destination character varying NOT NULL,
  notes text,
  CONSTRAINT trip_detail_pkey PRIMARY KEY (id),
  CONSTRAINT trip_detail_id_event_fkey FOREIGN KEY (id_event) REFERENCES public.event(id)
);
CREATE TABLE public.user (
  id integer NOT NULL DEFAULT nextval('user_id_seq'::regclass),
  id_church integer NOT NULL,
  id_member integer NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  id_user_role integer,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  supabase_uid uuid UNIQUE,
  CONSTRAINT user_pkey PRIMARY KEY (id),
  CONSTRAINT user_id_user_role_fkey FOREIGN KEY (id_user_role) REFERENCES public.user_role(id),
  CONSTRAINT user_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id),
  CONSTRAINT user_id_member_fkey FOREIGN KEY (id_member) REFERENCES public.member(id),
  CONSTRAINT user_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id)
);
CREATE TABLE public.user_role (
  id integer NOT NULL DEFAULT nextval('user_role_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by integer,
  id_church integer NOT NULL,
  CONSTRAINT user_role_pkey PRIMARY KEY (id),
  CONSTRAINT user_role_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(id),
  CONSTRAINT user_role_id_church_fkey FOREIGN KEY (id_church) REFERENCES public.church(id)
);