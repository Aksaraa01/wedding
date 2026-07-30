-- Initial schema: all tables for Aksaraa Wedding platform
-- WARNING: This migration is meant for a fresh database only.
-- Do NOT apply to existing production — it will conflict with existing data.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Users
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  phone_number character varying NOT NULL UNIQUE,
  role character varying DEFAULT 'CLIENT'::character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['ADMIN'::character varying, 'WORKER'::character varying, 'CONSULTANT'::character varying, 'CLIENT'::character varying]::text[]))
);

-- =====================================================
-- Packages
-- =====================================================
CREATE TABLE IF NOT EXISTS public.packages (
  code character varying NOT NULL,
  name character varying NOT NULL,
  description text,
  base_price numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT packages_pkey PRIMARY KEY (code)
);

-- =====================================================
-- Package Features
-- =====================================================
CREATE TABLE IF NOT EXISTS public.package_features (
  package_code character varying NOT NULL,
  feature_code character varying NOT NULL,
  is_included boolean DEFAULT true,
  CONSTRAINT package_features_pkey PRIMARY KEY (package_code, feature_code),
  CONSTRAINT package_features_package_code_fkey FOREIGN KEY (package_code) REFERENCES public.packages(code) ON DELETE CASCADE
);

-- =====================================================
-- Product Price Tiers
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_price_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_code character varying NOT NULL,
  min_qty integer NOT NULL,
  max_qty integer,
  price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_price_tiers_pkey PRIMARY KEY (id)
);

-- =====================================================
-- Package Matrix Sections
-- =====================================================
CREATE TABLE IF NOT EXISTS public.package_matrix_sections (
  code character varying NOT NULL,
  label character varying NOT NULL,
  sort_order integer DEFAULT 0,
  CONSTRAINT package_matrix_sections_pkey PRIMARY KEY (code)
);

-- =====================================================
-- Package Matrix Rows
-- =====================================================
CREATE TABLE IF NOT EXISTS public.package_matrix_rows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  section_code character varying,
  label character varying NOT NULL,
  essential_value character varying NOT NULL DEFAULT '—'::character varying,
  essential_emphasis character varying NOT NULL DEFAULT 'default'::character varying,
  signature_value character varying NOT NULL DEFAULT '—'::character varying,
  signature_emphasis character varying NOT NULL DEFAULT 'default'::character varying,
  prestige_value character varying NOT NULL DEFAULT '—'::character varying,
  prestige_emphasis character varying NOT NULL DEFAULT 'default'::character varying,
  sort_order integer DEFAULT 0,
  CONSTRAINT package_matrix_rows_pkey PRIMARY KEY (id),
  CONSTRAINT package_matrix_rows_section_code_fkey FOREIGN KEY (section_code) REFERENCES public.package_matrix_sections(code) ON DELETE CASCADE
);

-- =====================================================
-- Web Templates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.web_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  description text,
  preview_image_url text,
  demo_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  category character varying,
  CONSTRAINT web_templates_pkey PRIMARY KEY (id)
);

-- =====================================================
-- Web Tracks
-- =====================================================
CREATE TABLE IF NOT EXISTS public.web_tracks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  artist character varying,
  mood_category character varying NOT NULL,
  audio_url text NOT NULL DEFAULT ''::text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT web_tracks_pkey PRIMARY KEY (id)
);

-- =====================================================
-- Wedding Profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.wedding_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  bride_name character varying NOT NULL,
  groom_name character varying NOT NULL,
  estimated_wedding_date date NOT NULL,
  estimated_guest_count integer NOT NULL,
  slug character varying NOT NULL UNIQUE,
  total_project_cost numeric DEFAULT 0.00,
  payment_status character varying DEFAULT 'UNPAID'::character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  whatsapp_number character varying,
  package_type character varying DEFAULT 'signature'::character varying,
  express_service boolean DEFAULT false,
  wa_blast_tier integer DEFAULT 0,
  undangan_fisik boolean DEFAULT false,
  selected_template_id uuid,
  selected_track_id uuid,
  scanner_pin character varying,
  couple_illustration_url text,
  grayscale boolean DEFAULT false,
  is_published boolean DEFAULT false,
  groom_full_name text,
  bride_full_name text,
  groom_photo_url text,
  bride_photo_url text,
  groom_parents text,
  bride_parents text,
  groom_instagram text,
  sessions jsonb DEFAULT '[]'::jsonb,
  display_name text,
  quote_text text,
  quote_source text,
  stories jsonb DEFAULT '[]'::jsonb,
  gallery_photos jsonb DEFAULT '[]'::jsonb,
  inviting_families text DEFAULT '[]'::text,
  CONSTRAINT wedding_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT wedding_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_wedding_profiles_package_type FOREIGN KEY (package_type) REFERENCES public.packages(code),
  CONSTRAINT wedding_profiles_selected_template_id_fkey FOREIGN KEY (selected_template_id) REFERENCES public.web_templates(id),
  CONSTRAINT wedding_profiles_selected_track_id_fkey FOREIGN KEY (selected_track_id) REFERENCES public.web_tracks(id),
  CONSTRAINT wedding_profiles_estimated_guest_count_check CHECK (estimated_guest_count > 0),
  CONSTRAINT wedding_profiles_payment_status_check CHECK (payment_status::text = ANY (ARRAY['UNPAID'::character varying, 'PARTIAL_DP'::character varying, 'FULLY_PAID'::character varying]::text[]))
);

-- =====================================================
-- Guests
-- =====================================================
CREATE TABLE IF NOT EXISTS public.guests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wedding_profile_id uuid NOT NULL,
  name character varying NOT NULL,
  phone_number character varying NOT NULL DEFAULT ''::character varying,
  table_number character varying DEFAULT 'TBA'::character varying,
  category character varying DEFAULT 'Umum'::character varying,
  qr_token character varying DEFAULT NULL::character varying UNIQUE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_checked_in boolean DEFAULT false,
  checkin_timestamp timestamp with time zone,
  checked_in_by character varying,
  souvenir_claimed boolean DEFAULT false,
  guest_count integer DEFAULT 1,
  rsvp_status character varying DEFAULT 'BELUM_RESPON'::character varying,
  rsvp_pax_count integer,
  rsvp_message text,
  rsvp_responded_at timestamp with time zone,
  CONSTRAINT guests_pkey PRIMARY KEY (id),
  CONSTRAINT guests_wedding_profile_id_fkey FOREIGN KEY (wedding_profile_id) REFERENCES public.wedding_profiles(id),
  CONSTRAINT guests_rsvp_status_check CHECK (rsvp_status::text = ANY (ARRAY['HADIR'::character varying, 'TIDAK_HADIR'::character varying, 'BELUM_RESPON'::character varying]::text[]))
);

-- =====================================================
-- Employees
-- =====================================================
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  phone_number character varying NOT NULL UNIQUE,
  pin character varying NOT NULL,
  role character varying DEFAULT 'ops'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT employees_pkey PRIMARY KEY (id)
);

-- =====================================================
-- Ops Queue
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ops_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wedding_profile_id uuid NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  sla_started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  assigned_to uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ops_queue_pkey PRIMARY KEY (id),
  CONSTRAINT ops_queue_wedding_profile_id_fkey FOREIGN KEY (wedding_profile_id) REFERENCES public.wedding_profiles(id),
  CONSTRAINT ops_queue_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.employees(id)
);

-- =====================================================
-- Feature Actions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.feature_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ops_queue_id uuid NOT NULL,
  wedding_profile_id uuid NOT NULL,
  feature_key character varying NOT NULL,
  status character varying DEFAULT 'butuh_tindakan'::character varying,
  client_note text,
  image_url text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT feature_actions_pkey PRIMARY KEY (id),
  CONSTRAINT feature_actions_ops_queue_id_fkey FOREIGN KEY (ops_queue_id) REFERENCES public.ops_queue(id),
  CONSTRAINT feature_actions_wedding_profile_id_fkey FOREIGN KEY (wedding_profile_id) REFERENCES public.wedding_profiles(id)
);

-- =====================================================
-- Wishes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.wishes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wedding_profile_id uuid NOT NULL,
  guest_id uuid,
  name text NOT NULL,
  message text NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wishes_pkey PRIMARY KEY (id),
  CONSTRAINT wishes_wedding_profile_id_fkey FOREIGN KEY (wedding_profile_id) REFERENCES public.wedding_profiles(id),
  CONSTRAINT wishes_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id)
);

-- =====================================================
-- Guest Photos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.guest_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wedding_profile_id uuid NOT NULL,
  guest_id uuid NOT NULL UNIQUE,
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT guest_photos_pkey PRIMARY KEY (id),
  CONSTRAINT guest_photos_wedding_profile_id_fkey FOREIGN KEY (wedding_profile_id) REFERENCES public.wedding_profiles(id),
  CONSTRAINT guest_photos_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id)
);

-- =====================================================
-- Gift Accounts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gift_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wedding_profile_id uuid NOT NULL,
  type character varying NOT NULL,
  provider_name character varying,
  account_number character varying,
  account_name character varying,
  qris_image_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT gift_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT gift_accounts_wedding_profile_id_fkey FOREIGN KEY (wedding_profile_id) REFERENCES public.wedding_profiles(id),
  CONSTRAINT gift_accounts_type_check CHECK (type::text = ANY (ARRAY['bank'::character varying, 'ewallet'::character varying, 'qris'::character varying]::text[]))
);

-- =====================================================
-- Gift Addresses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gift_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wedding_profile_id uuid NOT NULL,
  label character varying,
  recipient_name character varying,
  phone character varying,
  full_address text,
  city character varying,
  postal_code character varying,
  courier_note text,
  is_primary boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT gift_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT gift_addresses_wedding_profile_id_fkey FOREIGN KEY (wedding_profile_id) REFERENCES public.wedding_profiles(id)
);

-- =====================================================
-- Feedback Submissions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wedding_profile_id uuid NOT NULL,
  template_id uuid,
  template_name character varying NOT NULL,
  area character varying,
  description text NOT NULL,
  image_url text,
  status character varying DEFAULT 'pending'::character varying,
  round_number integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT feedback_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_submissions_wedding_profile_id_fkey FOREIGN KEY (wedding_profile_id) REFERENCES public.wedding_profiles(id),
  CONSTRAINT feedback_submissions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.web_templates(id),
  CONSTRAINT feedback_submissions_status_check CHECK (status::text = ANY (ARRAY['pending'::character varying, 'in_progress'::character varying, 'resolved'::character varying]::text[]))
);

-- =====================================================
-- WA Blast Schedules
-- =====================================================
CREATE TABLE IF NOT EXISTS public.wa_blast_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wedding_profile_id uuid NOT NULL,
  template_type character varying NOT NULL,
  message_text text NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time without time zone NOT NULL,
  status character varying DEFAULT 'draft'::character varying,
  sent_count integer DEFAULT 0,
  queue_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  total_guests integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wa_blast_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT wa_blast_schedules_wedding_profile_id_fkey FOREIGN KEY (wedding_profile_id) REFERENCES public.wedding_profiles(id)
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_wedding_profiles_slug ON public.wedding_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS idx_guests_wedding_profile_id ON public.guests(wedding_profile_id);
CREATE INDEX IF NOT EXISTS idx_guests_dup_check ON public.guests(wedding_profile_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_guests_qr_token ON public.guests(qr_token);
CREATE INDEX IF NOT EXISTS idx_wishes_wedding_profile ON public.wishes(wedding_profile_id);
CREATE INDEX IF NOT EXISTS idx_wishes_status ON public.wishes(status);
CREATE INDEX IF NOT EXISTS idx_ops_queue_status ON public.ops_queue(status);
CREATE INDEX IF NOT EXISTS idx_ops_queue_wedding_profile ON public.ops_queue(wedding_profile_id);
CREATE INDEX IF NOT EXISTS idx_feature_actions_queue ON public.feature_actions(ops_queue_id);
CREATE INDEX IF NOT EXISTS idx_feature_actions_wedding_profile ON public.feature_actions(wedding_profile_id);
