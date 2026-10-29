import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('ru', 'kk');
  CREATE TYPE "public"."enum_leads_subjects" AS ENUM('math', 'physics', 'informatics');
  CREATE TYPE "public"."enum_leads_type" AS ENUM('registration', 'waitlist', 'school', 'regulations');
  CREATE TYPE "public"."enum_leads_locale" AS ENUM('ru', 'kk');
  CREATE TYPE "public"."enum_leads_subject" AS ENUM('math', 'physics', 'informatics');
  CREATE TYPE "public"."enum_leads_experience" AS ENUM('lt5', '5to15', 'gt15');
  CREATE TYPE "public"."enum_leads_region" AS ENUM('astana', 'almaty', 'shymkent', 'abai', 'akmola', 'aktobe', 'almaty_region', 'atyrau', 'east_kazakhstan', 'zhambyl', 'zhetysu', 'west_kazakhstan', 'karaganda', 'kostanay', 'kyzylorda', 'mangystau', 'pavlodar', 'north_kazakhstan', 'turkistan', 'ulytau');
  CREATE TYPE "public"."enum_leads_amo_sync_status" AS ENUM('pending', 'sent', 'failed', 'disabled');
  CREATE TYPE "public"."enum_landings_audience_cards_subject" AS ENUM('math', 'physics', 'informatics');
  CREATE TYPE "public"."enum_landings_audience_notes_icon" AS ENUM('Award', 'FileBadge', 'Hourglass', 'Building', 'GraduationCap', 'BookOpen', 'Brain', 'Calculator', 'Clock', 'Lightbulb', 'MessagesSquare', 'Mic', 'Sigma', 'Atom', 'Code', 'Trophy', 'Users', 'Handshake', 'Star', 'Target');
  CREATE TYPE "public"."enum_landings_audience_notes_action" AS ENUM('none', 'school');
  CREATE TYPE "public"."enum_landings_benefits_items_icon" AS ENUM('Award', 'FileBadge', 'Hourglass', 'Building', 'GraduationCap', 'BookOpen', 'Brain', 'Calculator', 'Clock', 'Lightbulb', 'MessagesSquare', 'Mic', 'Sigma', 'Atom', 'Code', 'Trophy', 'Users', 'Handshake', 'Star', 'Target');
  CREATE TYPE "public"."enum_landings_history_milestones_kind" AS ENUM('default', 'pause', 'current');
  CREATE TYPE "public"."enum__landings_v_version_audience_cards_subject" AS ENUM('math', 'physics', 'informatics');
  CREATE TYPE "public"."enum__landings_v_version_audience_notes_icon" AS ENUM('Award', 'FileBadge', 'Hourglass', 'Building', 'GraduationCap', 'BookOpen', 'Brain', 'Calculator', 'Clock', 'Lightbulb', 'MessagesSquare', 'Mic', 'Sigma', 'Atom', 'Code', 'Trophy', 'Users', 'Handshake', 'Star', 'Target');
  CREATE TYPE "public"."enum__landings_v_version_audience_notes_action" AS ENUM('none', 'school');
  CREATE TYPE "public"."enum__landings_v_version_benefits_items_icon" AS ENUM('Award', 'FileBadge', 'Hourglass', 'Building', 'GraduationCap', 'BookOpen', 'Brain', 'Calculator', 'Clock', 'Lightbulb', 'MessagesSquare', 'Mic', 'Sigma', 'Atom', 'Code', 'Trophy', 'Users', 'Handshake', 'Star', 'Target');
  CREATE TYPE "public"."enum__landings_v_version_history_milestones_kind" AS ENUM('default', 'pause', 'current');
  CREATE TYPE "public"."enum_events_subjects" AS ENUM('math', 'physics', 'informatics');
  CREATE TYPE "public"."enum_events_type" AS ENUM('contest', 'olympiad', 'seminar', 'training');
  CREATE TYPE "public"."enum_events_level" AS ENUM('international', 'republic', 'regional', 'city');
  CREATE TYPE "public"."enum_events_format" AS ENUM('offline', 'online');
  CREATE TYPE "public"."enum__events_v_version_subjects" AS ENUM('math', 'physics', 'informatics');
  CREATE TYPE "public"."enum__events_v_version_type" AS ENUM('contest', 'olympiad', 'seminar', 'training');
  CREATE TYPE "public"."enum__events_v_version_level" AS ENUM('international', 'republic', 'regional', 'city');
  CREATE TYPE "public"."enum__events_v_version_format" AS ENUM('offline', 'online');
  CREATE TYPE "public"."enum_people_roles" AS ENUM('team', 'speaker', 'jury', 'master');
  CREATE TYPE "public"."enum_people_subjects" AS ENUM('math', 'physics', 'informatics');
  CREATE TYPE "public"."enum_people_region" AS ENUM('astana', 'almaty', 'shymkent', 'abai', 'akmola', 'aktobe', 'almaty_region', 'atyrau', 'east_kazakhstan', 'zhambyl', 'zhetysu', 'west_kazakhstan', 'karaganda', 'kostanay', 'kyzylorda', 'mangystau', 'pavlodar', 'north_kazakhstan', 'turkistan', 'ulytau');
  CREATE TYPE "public"."enum_partners_kind" AS ENUM('ministry', 'organizer', 'partner', 'university', 'sponsor', 'media');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'manager');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'amocrmSendLead');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'amocrmSendLead');
  CREATE TYPE "public"."enum_site_settings_socials_network" AS ENUM('instagram', 'facebook', 'telegram', 'whatsapp', 'youtube', 'tiktok', 'vk', 'other');
  CREATE TYPE "public"."enum__site_settings_v_version_socials_network" AS ENUM('instagram', 'facebook', 'telegram', 'whatsapp', 'youtube', 'tiktok', 'vk', 'other');
  CREATE TABLE "leads_subjects" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_leads_subjects",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_name" varchar,
  	"type" "enum_leads_type" NOT NULL,
  	"locale" "enum_leads_locale" DEFAULT 'ru',
  	"event_id" integer,
  	"landing_id" integer,
  	"full_name" varchar,
  	"subject" "enum_leads_subject",
  	"experience" "enum_leads_experience",
  	"region" "enum_leads_region",
  	"city" varchar,
  	"school" varchar,
  	"how_heard" varchar,
  	"organization" varchar,
  	"contact_person" varchar,
  	"participants_count" numeric,
  	"phone" varchar,
  	"email" varchar,
  	"consent" boolean,
  	"consent_at" timestamp(3) with time zone,
  	"attribution_utm_source" varchar,
  	"attribution_utm_medium" varchar,
  	"attribution_utm_campaign" varchar,
  	"attribution_utm_content" varchar,
  	"attribution_utm_term" varchar,
  	"attribution_device" varchar,
  	"attribution_referrer" varchar,
  	"attribution_landing_path" varchar,
  	"attribution_visitor_id" varchar,
  	"attribution_session_id" varchar,
  	"payment_paid" boolean DEFAULT false,
  	"payment_paid_at" timestamp(3) with time zone,
  	"amo_sync_status" "enum_leads_amo_sync_status" DEFAULT 'pending',
  	"amo_lead_id" numeric,
  	"amo_contact_id" numeric,
  	"amo_attempts" numeric DEFAULT 0,
  	"amo_last_error" varchar,
  	"amo_synced_at" timestamp(3) with time zone,
  	"amo_pipeline_id" numeric,
  	"amo_status_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "landings_hero_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "landings_hero_stats_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landings_audience_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"subject" "enum_landings_audience_cards_subject"
  );
  
  CREATE TABLE "landings_audience_cards_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landings_audience_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_landings_audience_notes_icon",
  	"action" "enum_landings_audience_notes_action" DEFAULT 'none'
  );
  
  CREATE TABLE "landings_audience_notes_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landings_benefits_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_landings_benefits_items_icon"
  );
  
  CREATE TABLE "landings_benefits_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landings_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "landings_gallery_images_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landings_pricing_includes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "landings_pricing_includes_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landings_history_milestones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"period" varchar,
  	"kind" "enum_landings_history_milestones_kind" DEFAULT 'default'
  );
  
  CREATE TABLE "landings_history_milestones_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landings_history_figures" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "landings_history_figures_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landings_history_prizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "landings_history_prizes_locales" (
  	"title" varchar,
  	"value" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landings_stories_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"person_id" integer
  );
  
  CREATE TABLE "landings_stories_items_locales" (
  	"quote" varchar,
  	"achievement" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landings_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "landings_faq_items_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landings_forms_how_heard_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "landings_forms_how_heard_options_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"internal_title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"event_id" integer NOT NULL,
  	"hero_partner_logo_id" integer,
  	"address_author_id" integer,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "landings_locales" (
  	"hero_eyebrow" varchar,
  	"hero_heading" varchar,
  	"hero_subheading" varchar,
  	"hero_partner_note" varchar,
  	"hero_primary_cta" varchar,
  	"hero_secondary_cta" varchar,
  	"audience_heading" varchar,
  	"audience_lead" varchar,
  	"benefits_heading" varchar,
  	"benefits_lead" varchar,
  	"gallery_heading" varchar,
  	"gallery_lead" varchar,
  	"program_heading" varchar,
  	"program_note" varchar,
  	"pricing_heading" varchar,
  	"pricing_document_note" varchar,
  	"pricing_group_terms" varchar,
  	"pricing_payment_note" varchar,
  	"pricing_deadline_note" varchar,
  	"speakers_heading" varchar,
  	"speakers_lead" varchar,
  	"history_heading" varchar,
  	"history_lead" varchar,
  	"stories_heading" varchar,
  	"stories_lead" varchar,
  	"address_heading" varchar,
  	"address_body" jsonb,
  	"address_signature" varchar,
  	"partners_heading" varchar,
  	"faq_heading" varchar,
  	"contacts_heading" varchar,
  	"contacts_final_cta" varchar,
  	"forms_school_note" varchar,
  	"forms_consent_text" varchar,
  	"thank_you_heading" varchar,
  	"thank_you_body" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "landings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "_landings_v_version_hero_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_landings_v_version_hero_stats_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_landings_v_version_audience_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"subject" "enum__landings_v_version_audience_cards_subject",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_landings_v_version_audience_cards_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_landings_v_version_audience_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__landings_v_version_audience_notes_icon",
  	"action" "enum__landings_v_version_audience_notes_action" DEFAULT 'none',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_landings_v_version_audience_notes_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_landings_v_version_benefits_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__landings_v_version_benefits_items_icon",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_landings_v_version_benefits_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_landings_v_version_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_landings_v_version_gallery_images_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_landings_v_version_pricing_includes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_landings_v_version_pricing_includes_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_landings_v_version_history_milestones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"period" varchar,
  	"kind" "enum__landings_v_version_history_milestones_kind" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_landings_v_version_history_milestones_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_landings_v_version_history_figures" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_landings_v_version_history_figures_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_landings_v_version_history_prizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_landings_v_version_history_prizes_locales" (
  	"title" varchar,
  	"value" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_landings_v_version_stories_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"person_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_landings_v_version_stories_items_locales" (
  	"quote" varchar,
  	"achievement" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_landings_v_version_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_landings_v_version_faq_items_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_landings_v_version_forms_how_heard_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_landings_v_version_forms_how_heard_options_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_landings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_internal_title" varchar NOT NULL,
  	"version_slug" varchar NOT NULL,
  	"version_event_id" integer NOT NULL,
  	"version_hero_partner_logo_id" integer,
  	"version_address_author_id" integer,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_landings_v_locales" (
  	"version_hero_eyebrow" varchar,
  	"version_hero_heading" varchar,
  	"version_hero_subheading" varchar,
  	"version_hero_partner_note" varchar,
  	"version_hero_primary_cta" varchar,
  	"version_hero_secondary_cta" varchar,
  	"version_audience_heading" varchar,
  	"version_audience_lead" varchar,
  	"version_benefits_heading" varchar,
  	"version_benefits_lead" varchar,
  	"version_gallery_heading" varchar,
  	"version_gallery_lead" varchar,
  	"version_program_heading" varchar,
  	"version_program_note" varchar,
  	"version_pricing_heading" varchar,
  	"version_pricing_document_note" varchar,
  	"version_pricing_group_terms" varchar,
  	"version_pricing_payment_note" varchar,
  	"version_pricing_deadline_note" varchar,
  	"version_speakers_heading" varchar,
  	"version_speakers_lead" varchar,
  	"version_history_heading" varchar,
  	"version_history_lead" varchar,
  	"version_stories_heading" varchar,
  	"version_stories_lead" varchar,
  	"version_address_heading" varchar,
  	"version_address_body" jsonb,
  	"version_address_signature" varchar,
  	"version_partners_heading" varchar,
  	"version_faq_heading" varchar,
  	"version_contacts_heading" varchar,
  	"version_contacts_final_cta" varchar,
  	"version_forms_school_note" varchar,
  	"version_forms_consent_text" varchar,
  	"version_thank_you_heading" varchar,
  	"version_thank_you_body" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_landings_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "events_subjects" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_events_subjects",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "events_program_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"time" varchar
  );
  
  CREATE TABLE "events_program_items_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "events_program" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone
  );
  
  CREATE TABLE "events_program_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"type" "enum_events_type" DEFAULT 'contest' NOT NULL,
  	"level" "enum_events_level",
  	"format" "enum_events_format" DEFAULT 'offline',
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone,
  	"registration_deadline" timestamp(3) with time zone,
  	"price" numeric NOT NULL,
  	"group_min_size" numeric DEFAULT 5,
  	"map_url" varchar,
  	"regulations_pdf_id" integer,
  	"certificate_sample_id" integer,
  	"participants_chat_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_locales" (
  	"title" varchar NOT NULL,
  	"city" varchar,
  	"venue" varchar,
  	"venue_address" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_events_v_version_subjects" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__events_v_version_subjects",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_events_v_version_program_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"time" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_version_program_items_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_events_v_version_program" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_version_program_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar NOT NULL,
  	"version_type" "enum__events_v_version_type" DEFAULT 'contest' NOT NULL,
  	"version_level" "enum__events_v_version_level",
  	"version_format" "enum__events_v_version_format" DEFAULT 'offline',
  	"version_start_date" timestamp(3) with time zone NOT NULL,
  	"version_end_date" timestamp(3) with time zone,
  	"version_registration_deadline" timestamp(3) with time zone,
  	"version_price" numeric NOT NULL,
  	"version_group_min_size" numeric DEFAULT 5,
  	"version_map_url" varchar,
  	"version_regulations_pdf_id" integer,
  	"version_certificate_sample_id" integer,
  	"version_participants_chat_url" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_events_v_locales" (
  	"version_title" varchar NOT NULL,
  	"version_city" varchar,
  	"version_venue" varchar,
  	"version_venue_address" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "people_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_people_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "people_subjects" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_people_subjects",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "people" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"photo_id" integer,
  	"region" "enum_people_region",
  	"first_participation_year" numeric,
  	"order" numeric DEFAULT 100,
  	"publish_consent" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "people_locales" (
  	"position" varchar,
  	"contribution" varchar,
  	"school" varchar,
  	"student_achievements" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"url" varchar,
  	"kind" "enum_partners_kind" DEFAULT 'organizer' NOT NULL,
  	"order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "partners_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "analytics_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event" varchar NOT NULL,
  	"visitor_id" varchar NOT NULL,
  	"session_id" varchar NOT NULL,
  	"props" jsonb,
  	"path" varchar,
  	"locale" varchar,
  	"landing" varchar,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"utm_content" varchar,
  	"utm_term" varchar,
  	"referrer" varchar,
  	"landing_path" varchar,
  	"channel" varchar,
  	"device" varchar,
  	"browser" varchar,
  	"os" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"leads_id" integer,
  	"landings_id" integer,
  	"events_id" integer,
  	"people_id" integer,
  	"partners_id" integer,
  	"media_id" integer,
  	"users_id" integer,
  	"analytics_events_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_phones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_phones_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"network" "enum_site_settings_socials_network" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_socials_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"active_landing_id" integer,
  	"whatsapp" varchar,
  	"email" varchar,
  	"offer_pdf_id" integer,
  	"privacy_pdf_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"association_name" varchar,
  	"address" varchar,
  	"requisites" varchar,
  	"offer_text" jsonb,
  	"privacy_text" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_version_phones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_phones_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_version_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"network" "enum__site_settings_v_version_socials_network" NOT NULL,
  	"url" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_socials_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_site_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_logo_id" integer,
  	"version_active_landing_id" integer,
  	"version_whatsapp" varchar,
  	"version_email" varchar,
  	"version_offer_pdf_id" integer,
  	"version_privacy_pdf_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_locales" (
  	"version_association_name" varchar,
  	"version_address" varchar,
  	"version_requisites" varchar,
  	"version_offer_text" jsonb,
  	"version_privacy_text" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "integrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"amocrm_enabled" boolean DEFAULT false,
  	"amocrm_base_url" varchar,
  	"amocrm_access_token" varchar,
  	"amocrm_pipelines_cache" jsonb,
  	"amocrm_pipeline_id" numeric,
  	"amocrm_new_status_id" numeric,
  	"amocrm_field_map" jsonb,
  	"amocrm_webhook_secret" varchar,
  	"pixels_meta_pixel_id" varchar,
  	"pixels_tiktok_pixel_id" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "integrations_numbers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" numeric,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL
  );
  
  CREATE TABLE "analytics_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"plan_step1" numeric DEFAULT 200 NOT NULL,
  	"plan_step2" numeric DEFAULT 300 NOT NULL,
  	"plan_step3" numeric DEFAULT 400 NOT NULL,
  	"count_school_participants" boolean DEFAULT true,
  	"excluded_visitor_ids" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "leads_subjects" ADD CONSTRAINT "leads_subjects_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_landing_id_landings_id_fk" FOREIGN KEY ("landing_id") REFERENCES "public"."landings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landings_hero_stats" ADD CONSTRAINT "landings_hero_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_hero_stats_locales" ADD CONSTRAINT "landings_hero_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings_hero_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_audience_cards" ADD CONSTRAINT "landings_audience_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_audience_cards_locales" ADD CONSTRAINT "landings_audience_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings_audience_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_audience_notes" ADD CONSTRAINT "landings_audience_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_audience_notes_locales" ADD CONSTRAINT "landings_audience_notes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings_audience_notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_benefits_items" ADD CONSTRAINT "landings_benefits_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_benefits_items_locales" ADD CONSTRAINT "landings_benefits_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings_benefits_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_gallery_images" ADD CONSTRAINT "landings_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landings_gallery_images" ADD CONSTRAINT "landings_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_gallery_images_locales" ADD CONSTRAINT "landings_gallery_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings_gallery_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_pricing_includes" ADD CONSTRAINT "landings_pricing_includes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_pricing_includes_locales" ADD CONSTRAINT "landings_pricing_includes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings_pricing_includes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_history_milestones" ADD CONSTRAINT "landings_history_milestones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_history_milestones_locales" ADD CONSTRAINT "landings_history_milestones_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings_history_milestones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_history_figures" ADD CONSTRAINT "landings_history_figures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_history_figures_locales" ADD CONSTRAINT "landings_history_figures_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings_history_figures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_history_prizes" ADD CONSTRAINT "landings_history_prizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_history_prizes_locales" ADD CONSTRAINT "landings_history_prizes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings_history_prizes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_stories_items" ADD CONSTRAINT "landings_stories_items_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landings_stories_items" ADD CONSTRAINT "landings_stories_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_stories_items_locales" ADD CONSTRAINT "landings_stories_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings_stories_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_faq_items" ADD CONSTRAINT "landings_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_faq_items_locales" ADD CONSTRAINT "landings_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_forms_how_heard_options" ADD CONSTRAINT "landings_forms_how_heard_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_forms_how_heard_options_locales" ADD CONSTRAINT "landings_forms_how_heard_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings_forms_how_heard_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings" ADD CONSTRAINT "landings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landings" ADD CONSTRAINT "landings_hero_partner_logo_id_media_id_fk" FOREIGN KEY ("hero_partner_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landings" ADD CONSTRAINT "landings_address_author_id_people_id_fk" FOREIGN KEY ("address_author_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landings" ADD CONSTRAINT "landings_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landings_locales" ADD CONSTRAINT "landings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_rels" ADD CONSTRAINT "landings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_rels" ADD CONSTRAINT "landings_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landings_rels" ADD CONSTRAINT "landings_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_hero_stats" ADD CONSTRAINT "_landings_v_version_hero_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_hero_stats_locales" ADD CONSTRAINT "_landings_v_version_hero_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v_version_hero_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_audience_cards" ADD CONSTRAINT "_landings_v_version_audience_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_audience_cards_locales" ADD CONSTRAINT "_landings_v_version_audience_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v_version_audience_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_audience_notes" ADD CONSTRAINT "_landings_v_version_audience_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_audience_notes_locales" ADD CONSTRAINT "_landings_v_version_audience_notes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v_version_audience_notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_benefits_items" ADD CONSTRAINT "_landings_v_version_benefits_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_benefits_items_locales" ADD CONSTRAINT "_landings_v_version_benefits_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v_version_benefits_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_gallery_images" ADD CONSTRAINT "_landings_v_version_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_landings_v_version_gallery_images" ADD CONSTRAINT "_landings_v_version_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_gallery_images_locales" ADD CONSTRAINT "_landings_v_version_gallery_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v_version_gallery_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_pricing_includes" ADD CONSTRAINT "_landings_v_version_pricing_includes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_pricing_includes_locales" ADD CONSTRAINT "_landings_v_version_pricing_includes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v_version_pricing_includes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_history_milestones" ADD CONSTRAINT "_landings_v_version_history_milestones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_history_milestones_locales" ADD CONSTRAINT "_landings_v_version_history_milestones_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v_version_history_milestones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_history_figures" ADD CONSTRAINT "_landings_v_version_history_figures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_history_figures_locales" ADD CONSTRAINT "_landings_v_version_history_figures_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v_version_history_figures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_history_prizes" ADD CONSTRAINT "_landings_v_version_history_prizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_history_prizes_locales" ADD CONSTRAINT "_landings_v_version_history_prizes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v_version_history_prizes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_stories_items" ADD CONSTRAINT "_landings_v_version_stories_items_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_landings_v_version_stories_items" ADD CONSTRAINT "_landings_v_version_stories_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_stories_items_locales" ADD CONSTRAINT "_landings_v_version_stories_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v_version_stories_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_faq_items" ADD CONSTRAINT "_landings_v_version_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_faq_items_locales" ADD CONSTRAINT "_landings_v_version_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v_version_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_forms_how_heard_options" ADD CONSTRAINT "_landings_v_version_forms_how_heard_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_version_forms_how_heard_options_locales" ADD CONSTRAINT "_landings_v_version_forms_how_heard_options_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v_version_forms_how_heard_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v" ADD CONSTRAINT "_landings_v_parent_id_landings_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."landings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_landings_v" ADD CONSTRAINT "_landings_v_version_event_id_events_id_fk" FOREIGN KEY ("version_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_landings_v" ADD CONSTRAINT "_landings_v_version_hero_partner_logo_id_media_id_fk" FOREIGN KEY ("version_hero_partner_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_landings_v" ADD CONSTRAINT "_landings_v_version_address_author_id_people_id_fk" FOREIGN KEY ("version_address_author_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_landings_v" ADD CONSTRAINT "_landings_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_landings_v_locales" ADD CONSTRAINT "_landings_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_rels" ADD CONSTRAINT "_landings_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_landings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_rels" ADD CONSTRAINT "_landings_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landings_v_rels" ADD CONSTRAINT "_landings_v_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_subjects" ADD CONSTRAINT "events_subjects_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_program_items" ADD CONSTRAINT "events_program_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_program"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_program_items_locales" ADD CONSTRAINT "events_program_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_program_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_program" ADD CONSTRAINT "events_program_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_program_locales" ADD CONSTRAINT "events_program_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_program"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_regulations_pdf_id_media_id_fk" FOREIGN KEY ("regulations_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_certificate_sample_id_media_id_fk" FOREIGN KEY ("certificate_sample_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_locales" ADD CONSTRAINT "events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_subjects" ADD CONSTRAINT "_events_v_version_subjects_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_program_items" ADD CONSTRAINT "_events_v_version_program_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v_version_program"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_program_items_locales" ADD CONSTRAINT "_events_v_version_program_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v_version_program_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_program" ADD CONSTRAINT "_events_v_version_program_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_program_locales" ADD CONSTRAINT "_events_v_version_program_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v_version_program"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_regulations_pdf_id_media_id_fk" FOREIGN KEY ("version_regulations_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_certificate_sample_id_media_id_fk" FOREIGN KEY ("version_certificate_sample_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_locales" ADD CONSTRAINT "_events_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people_roles" ADD CONSTRAINT "people_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people_subjects" ADD CONSTRAINT "people_subjects_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people_locales" ADD CONSTRAINT "people_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_locales" ADD CONSTRAINT "partners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_landings_fk" FOREIGN KEY ("landings_id") REFERENCES "public"."landings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_events_fk" FOREIGN KEY ("analytics_events_id") REFERENCES "public"."analytics_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_phones" ADD CONSTRAINT "site_settings_phones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_phones_locales" ADD CONSTRAINT "site_settings_phones_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_phones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_socials" ADD CONSTRAINT "site_settings_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_socials_locales" ADD CONSTRAINT "site_settings_socials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_socials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_active_landing_id_landings_id_fk" FOREIGN KEY ("active_landing_id") REFERENCES "public"."landings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_offer_pdf_id_media_id_fk" FOREIGN KEY ("offer_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_privacy_pdf_id_media_id_fk" FOREIGN KEY ("privacy_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_phones" ADD CONSTRAINT "_site_settings_v_version_phones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_phones_locales" ADD CONSTRAINT "_site_settings_v_version_phones_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v_version_phones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_socials" ADD CONSTRAINT "_site_settings_v_version_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_socials_locales" ADD CONSTRAINT "_site_settings_v_version_socials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v_version_socials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_active_landing_id_landings_id_fk" FOREIGN KEY ("version_active_landing_id") REFERENCES "public"."landings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_offer_pdf_id_media_id_fk" FOREIGN KEY ("version_offer_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_privacy_pdf_id_media_id_fk" FOREIGN KEY ("version_privacy_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v_locales" ADD CONSTRAINT "_site_settings_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "integrations_numbers" ADD CONSTRAINT "integrations_numbers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "leads_subjects_order_idx" ON "leads_subjects" USING btree ("order");
  CREATE INDEX "leads_subjects_parent_idx" ON "leads_subjects" USING btree ("parent_id");
  CREATE INDEX "leads_display_name_idx" ON "leads" USING btree ("display_name");
  CREATE INDEX "leads_type_idx" ON "leads" USING btree ("type");
  CREATE INDEX "leads_event_idx" ON "leads" USING btree ("event_id");
  CREATE INDEX "leads_landing_idx" ON "leads" USING btree ("landing_id");
  CREATE INDEX "leads_region_idx" ON "leads" USING btree ("region");
  CREATE INDEX "leads_phone_idx" ON "leads" USING btree ("phone");
  CREATE INDEX "leads_attribution_attribution_visitor_id_idx" ON "leads" USING btree ("attribution_visitor_id");
  CREATE INDEX "leads_payment_payment_paid_idx" ON "leads" USING btree ("payment_paid");
  CREATE INDEX "leads_amo_amo_sync_status_idx" ON "leads" USING btree ("amo_sync_status");
  CREATE INDEX "leads_amo_amo_lead_id_idx" ON "leads" USING btree ("amo_lead_id");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "landings_hero_stats_order_idx" ON "landings_hero_stats" USING btree ("_order");
  CREATE INDEX "landings_hero_stats_parent_id_idx" ON "landings_hero_stats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landings_hero_stats_locales_locale_parent_id_unique" ON "landings_hero_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landings_hero_stats_locales_parent_id_idx" ON "landings_hero_stats_locales" USING btree ("_parent_id");
  CREATE INDEX "landings_audience_cards_order_idx" ON "landings_audience_cards" USING btree ("_order");
  CREATE INDEX "landings_audience_cards_parent_id_idx" ON "landings_audience_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landings_audience_cards_locales_locale_parent_id_unique" ON "landings_audience_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landings_audience_cards_locales_parent_id_idx" ON "landings_audience_cards_locales" USING btree ("_parent_id");
  CREATE INDEX "landings_audience_notes_order_idx" ON "landings_audience_notes" USING btree ("_order");
  CREATE INDEX "landings_audience_notes_parent_id_idx" ON "landings_audience_notes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landings_audience_notes_locales_locale_parent_id_unique" ON "landings_audience_notes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landings_audience_notes_locales_parent_id_idx" ON "landings_audience_notes_locales" USING btree ("_parent_id");
  CREATE INDEX "landings_benefits_items_order_idx" ON "landings_benefits_items" USING btree ("_order");
  CREATE INDEX "landings_benefits_items_parent_id_idx" ON "landings_benefits_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landings_benefits_items_locales_locale_parent_id_unique" ON "landings_benefits_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landings_benefits_items_locales_parent_id_idx" ON "landings_benefits_items_locales" USING btree ("_parent_id");
  CREATE INDEX "landings_gallery_images_order_idx" ON "landings_gallery_images" USING btree ("_order");
  CREATE INDEX "landings_gallery_images_parent_id_idx" ON "landings_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "landings_gallery_images_image_idx" ON "landings_gallery_images" USING btree ("image_id");
  CREATE UNIQUE INDEX "landings_gallery_images_locales_locale_parent_id_unique" ON "landings_gallery_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landings_gallery_images_locales_parent_id_idx" ON "landings_gallery_images_locales" USING btree ("_parent_id");
  CREATE INDEX "landings_pricing_includes_order_idx" ON "landings_pricing_includes" USING btree ("_order");
  CREATE INDEX "landings_pricing_includes_parent_id_idx" ON "landings_pricing_includes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landings_pricing_includes_locales_locale_parent_id_unique" ON "landings_pricing_includes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landings_pricing_includes_locales_parent_id_idx" ON "landings_pricing_includes_locales" USING btree ("_parent_id");
  CREATE INDEX "landings_history_milestones_order_idx" ON "landings_history_milestones" USING btree ("_order");
  CREATE INDEX "landings_history_milestones_parent_id_idx" ON "landings_history_milestones" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landings_history_milestones_locales_locale_parent_id_unique" ON "landings_history_milestones_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landings_history_milestones_locales_parent_id_idx" ON "landings_history_milestones_locales" USING btree ("_parent_id");
  CREATE INDEX "landings_history_figures_order_idx" ON "landings_history_figures" USING btree ("_order");
  CREATE INDEX "landings_history_figures_parent_id_idx" ON "landings_history_figures" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landings_history_figures_locales_locale_parent_id_unique" ON "landings_history_figures_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landings_history_figures_locales_parent_id_idx" ON "landings_history_figures_locales" USING btree ("_parent_id");
  CREATE INDEX "landings_history_prizes_order_idx" ON "landings_history_prizes" USING btree ("_order");
  CREATE INDEX "landings_history_prizes_parent_id_idx" ON "landings_history_prizes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landings_history_prizes_locales_locale_parent_id_unique" ON "landings_history_prizes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landings_history_prizes_locales_parent_id_idx" ON "landings_history_prizes_locales" USING btree ("_parent_id");
  CREATE INDEX "landings_stories_items_order_idx" ON "landings_stories_items" USING btree ("_order");
  CREATE INDEX "landings_stories_items_parent_id_idx" ON "landings_stories_items" USING btree ("_parent_id");
  CREATE INDEX "landings_stories_items_person_idx" ON "landings_stories_items" USING btree ("person_id");
  CREATE UNIQUE INDEX "landings_stories_items_locales_locale_parent_id_unique" ON "landings_stories_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landings_stories_items_locales_parent_id_idx" ON "landings_stories_items_locales" USING btree ("_parent_id");
  CREATE INDEX "landings_faq_items_order_idx" ON "landings_faq_items" USING btree ("_order");
  CREATE INDEX "landings_faq_items_parent_id_idx" ON "landings_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landings_faq_items_locales_locale_parent_id_unique" ON "landings_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landings_faq_items_locales_parent_id_idx" ON "landings_faq_items_locales" USING btree ("_parent_id");
  CREATE INDEX "landings_forms_how_heard_options_order_idx" ON "landings_forms_how_heard_options" USING btree ("_order");
  CREATE INDEX "landings_forms_how_heard_options_parent_id_idx" ON "landings_forms_how_heard_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landings_forms_how_heard_options_locales_locale_parent_id_un" ON "landings_forms_how_heard_options_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landings_forms_how_heard_options_locales_parent_id_idx" ON "landings_forms_how_heard_options_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landings_slug_idx" ON "landings" USING btree ("slug");
  CREATE INDEX "landings_event_idx" ON "landings" USING btree ("event_id");
  CREATE INDEX "landings_hero_hero_partner_logo_idx" ON "landings" USING btree ("hero_partner_logo_id");
  CREATE INDEX "landings_address_address_author_idx" ON "landings" USING btree ("address_author_id");
  CREATE INDEX "landings_seo_seo_og_image_idx" ON "landings" USING btree ("seo_og_image_id");
  CREATE INDEX "landings_updated_at_idx" ON "landings" USING btree ("updated_at");
  CREATE INDEX "landings_created_at_idx" ON "landings" USING btree ("created_at");
  CREATE UNIQUE INDEX "landings_locales_locale_parent_id_unique" ON "landings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landings_locales_parent_id_idx" ON "landings_locales" USING btree ("_parent_id");
  CREATE INDEX "landings_rels_order_idx" ON "landings_rels" USING btree ("order");
  CREATE INDEX "landings_rels_parent_idx" ON "landings_rels" USING btree ("parent_id");
  CREATE INDEX "landings_rels_path_idx" ON "landings_rels" USING btree ("path");
  CREATE INDEX "landings_rels_people_id_idx" ON "landings_rels" USING btree ("people_id");
  CREATE INDEX "landings_rels_partners_id_idx" ON "landings_rels" USING btree ("partners_id");
  CREATE INDEX "_landings_v_version_hero_stats_order_idx" ON "_landings_v_version_hero_stats" USING btree ("_order");
  CREATE INDEX "_landings_v_version_hero_stats_parent_id_idx" ON "_landings_v_version_hero_stats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_landings_v_version_hero_stats_locales_locale_parent_id_uniq" ON "_landings_v_version_hero_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_landings_v_version_hero_stats_locales_parent_id_idx" ON "_landings_v_version_hero_stats_locales" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_version_audience_cards_order_idx" ON "_landings_v_version_audience_cards" USING btree ("_order");
  CREATE INDEX "_landings_v_version_audience_cards_parent_id_idx" ON "_landings_v_version_audience_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_landings_v_version_audience_cards_locales_locale_parent_id_" ON "_landings_v_version_audience_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_landings_v_version_audience_cards_locales_parent_id_idx" ON "_landings_v_version_audience_cards_locales" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_version_audience_notes_order_idx" ON "_landings_v_version_audience_notes" USING btree ("_order");
  CREATE INDEX "_landings_v_version_audience_notes_parent_id_idx" ON "_landings_v_version_audience_notes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_landings_v_version_audience_notes_locales_locale_parent_id_" ON "_landings_v_version_audience_notes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_landings_v_version_audience_notes_locales_parent_id_idx" ON "_landings_v_version_audience_notes_locales" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_version_benefits_items_order_idx" ON "_landings_v_version_benefits_items" USING btree ("_order");
  CREATE INDEX "_landings_v_version_benefits_items_parent_id_idx" ON "_landings_v_version_benefits_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_landings_v_version_benefits_items_locales_locale_parent_id_" ON "_landings_v_version_benefits_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_landings_v_version_benefits_items_locales_parent_id_idx" ON "_landings_v_version_benefits_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_version_gallery_images_order_idx" ON "_landings_v_version_gallery_images" USING btree ("_order");
  CREATE INDEX "_landings_v_version_gallery_images_parent_id_idx" ON "_landings_v_version_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_version_gallery_images_image_idx" ON "_landings_v_version_gallery_images" USING btree ("image_id");
  CREATE UNIQUE INDEX "_landings_v_version_gallery_images_locales_locale_parent_id_" ON "_landings_v_version_gallery_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_landings_v_version_gallery_images_locales_parent_id_idx" ON "_landings_v_version_gallery_images_locales" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_version_pricing_includes_order_idx" ON "_landings_v_version_pricing_includes" USING btree ("_order");
  CREATE INDEX "_landings_v_version_pricing_includes_parent_id_idx" ON "_landings_v_version_pricing_includes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_landings_v_version_pricing_includes_locales_locale_parent_i" ON "_landings_v_version_pricing_includes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_landings_v_version_pricing_includes_locales_parent_id_idx" ON "_landings_v_version_pricing_includes_locales" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_version_history_milestones_order_idx" ON "_landings_v_version_history_milestones" USING btree ("_order");
  CREATE INDEX "_landings_v_version_history_milestones_parent_id_idx" ON "_landings_v_version_history_milestones" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_landings_v_version_history_milestones_locales_locale_parent" ON "_landings_v_version_history_milestones_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_landings_v_version_history_milestones_locales_parent_id_idx" ON "_landings_v_version_history_milestones_locales" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_version_history_figures_order_idx" ON "_landings_v_version_history_figures" USING btree ("_order");
  CREATE INDEX "_landings_v_version_history_figures_parent_id_idx" ON "_landings_v_version_history_figures" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_landings_v_version_history_figures_locales_locale_parent_id" ON "_landings_v_version_history_figures_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_landings_v_version_history_figures_locales_parent_id_idx" ON "_landings_v_version_history_figures_locales" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_version_history_prizes_order_idx" ON "_landings_v_version_history_prizes" USING btree ("_order");
  CREATE INDEX "_landings_v_version_history_prizes_parent_id_idx" ON "_landings_v_version_history_prizes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_landings_v_version_history_prizes_locales_locale_parent_id_" ON "_landings_v_version_history_prizes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_landings_v_version_history_prizes_locales_parent_id_idx" ON "_landings_v_version_history_prizes_locales" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_version_stories_items_order_idx" ON "_landings_v_version_stories_items" USING btree ("_order");
  CREATE INDEX "_landings_v_version_stories_items_parent_id_idx" ON "_landings_v_version_stories_items" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_version_stories_items_person_idx" ON "_landings_v_version_stories_items" USING btree ("person_id");
  CREATE UNIQUE INDEX "_landings_v_version_stories_items_locales_locale_parent_id_u" ON "_landings_v_version_stories_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_landings_v_version_stories_items_locales_parent_id_idx" ON "_landings_v_version_stories_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_version_faq_items_order_idx" ON "_landings_v_version_faq_items" USING btree ("_order");
  CREATE INDEX "_landings_v_version_faq_items_parent_id_idx" ON "_landings_v_version_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_landings_v_version_faq_items_locales_locale_parent_id_uniqu" ON "_landings_v_version_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_landings_v_version_faq_items_locales_parent_id_idx" ON "_landings_v_version_faq_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_version_forms_how_heard_options_order_idx" ON "_landings_v_version_forms_how_heard_options" USING btree ("_order");
  CREATE INDEX "_landings_v_version_forms_how_heard_options_parent_id_idx" ON "_landings_v_version_forms_how_heard_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_landings_v_version_forms_how_heard_options_locales_locale_p" ON "_landings_v_version_forms_how_heard_options_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_landings_v_version_forms_how_heard_options_locales_pare_idx" ON "_landings_v_version_forms_how_heard_options_locales" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_parent_idx" ON "_landings_v" USING btree ("parent_id");
  CREATE INDEX "_landings_v_version_version_slug_idx" ON "_landings_v" USING btree ("version_slug");
  CREATE INDEX "_landings_v_version_version_event_idx" ON "_landings_v" USING btree ("version_event_id");
  CREATE INDEX "_landings_v_version_hero_version_hero_partner_logo_idx" ON "_landings_v" USING btree ("version_hero_partner_logo_id");
  CREATE INDEX "_landings_v_version_address_version_address_author_idx" ON "_landings_v" USING btree ("version_address_author_id");
  CREATE INDEX "_landings_v_version_seo_version_seo_og_image_idx" ON "_landings_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_landings_v_version_version_updated_at_idx" ON "_landings_v" USING btree ("version_updated_at");
  CREATE INDEX "_landings_v_version_version_created_at_idx" ON "_landings_v" USING btree ("version_created_at");
  CREATE INDEX "_landings_v_created_at_idx" ON "_landings_v" USING btree ("created_at");
  CREATE INDEX "_landings_v_updated_at_idx" ON "_landings_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_landings_v_locales_locale_parent_id_unique" ON "_landings_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_landings_v_locales_parent_id_idx" ON "_landings_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_landings_v_rels_order_idx" ON "_landings_v_rels" USING btree ("order");
  CREATE INDEX "_landings_v_rels_parent_idx" ON "_landings_v_rels" USING btree ("parent_id");
  CREATE INDEX "_landings_v_rels_path_idx" ON "_landings_v_rels" USING btree ("path");
  CREATE INDEX "_landings_v_rels_people_id_idx" ON "_landings_v_rels" USING btree ("people_id");
  CREATE INDEX "_landings_v_rels_partners_id_idx" ON "_landings_v_rels" USING btree ("partners_id");
  CREATE INDEX "events_subjects_order_idx" ON "events_subjects" USING btree ("order");
  CREATE INDEX "events_subjects_parent_idx" ON "events_subjects" USING btree ("parent_id");
  CREATE INDEX "events_program_items_order_idx" ON "events_program_items" USING btree ("_order");
  CREATE INDEX "events_program_items_parent_id_idx" ON "events_program_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "events_program_items_locales_locale_parent_id_unique" ON "events_program_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_program_items_locales_parent_id_idx" ON "events_program_items_locales" USING btree ("_parent_id");
  CREATE INDEX "events_program_order_idx" ON "events_program" USING btree ("_order");
  CREATE INDEX "events_program_parent_id_idx" ON "events_program" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "events_program_locales_locale_parent_id_unique" ON "events_program_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_program_locales_parent_id_idx" ON "events_program_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_regulations_pdf_idx" ON "events" USING btree ("regulations_pdf_id");
  CREATE INDEX "events_certificate_sample_idx" ON "events" USING btree ("certificate_sample_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE UNIQUE INDEX "events_locales_locale_parent_id_unique" ON "events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_locales_parent_id_idx" ON "events_locales" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_subjects_order_idx" ON "_events_v_version_subjects" USING btree ("order");
  CREATE INDEX "_events_v_version_subjects_parent_idx" ON "_events_v_version_subjects" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_program_items_order_idx" ON "_events_v_version_program_items" USING btree ("_order");
  CREATE INDEX "_events_v_version_program_items_parent_id_idx" ON "_events_v_version_program_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_events_v_version_program_items_locales_locale_parent_id_uni" ON "_events_v_version_program_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_version_program_items_locales_parent_id_idx" ON "_events_v_version_program_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_program_order_idx" ON "_events_v_version_program" USING btree ("_order");
  CREATE INDEX "_events_v_version_program_parent_id_idx" ON "_events_v_version_program" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_events_v_version_program_locales_locale_parent_id_unique" ON "_events_v_version_program_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_version_program_locales_parent_id_idx" ON "_events_v_version_program_locales" USING btree ("_parent_id");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_slug_idx" ON "_events_v" USING btree ("version_slug");
  CREATE INDEX "_events_v_version_version_regulations_pdf_idx" ON "_events_v" USING btree ("version_regulations_pdf_id");
  CREATE INDEX "_events_v_version_version_certificate_sample_idx" ON "_events_v" USING btree ("version_certificate_sample_id");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_events_v_locales_locale_parent_id_unique" ON "_events_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_locales_parent_id_idx" ON "_events_v_locales" USING btree ("_parent_id");
  CREATE INDEX "people_roles_order_idx" ON "people_roles" USING btree ("order");
  CREATE INDEX "people_roles_parent_idx" ON "people_roles" USING btree ("parent_id");
  CREATE INDEX "people_subjects_order_idx" ON "people_subjects" USING btree ("order");
  CREATE INDEX "people_subjects_parent_idx" ON "people_subjects" USING btree ("parent_id");
  CREATE INDEX "people_photo_idx" ON "people" USING btree ("photo_id");
  CREATE INDEX "people_updated_at_idx" ON "people" USING btree ("updated_at");
  CREATE INDEX "people_created_at_idx" ON "people" USING btree ("created_at");
  CREATE UNIQUE INDEX "people_locales_locale_parent_id_unique" ON "people_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "people_locales_parent_id_idx" ON "people_locales" USING btree ("_parent_id");
  CREATE INDEX "partners_logo_idx" ON "partners" USING btree ("logo_id");
  CREATE INDEX "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "partners" USING btree ("created_at");
  CREATE UNIQUE INDEX "partners_locales_locale_parent_id_unique" ON "partners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "partners_locales_parent_id_idx" ON "partners_locales" USING btree ("_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "analytics_events_session_id_idx" ON "analytics_events" USING btree ("session_id");
  CREATE INDEX "analytics_events_updated_at_idx" ON "analytics_events" USING btree ("updated_at");
  CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events" USING btree ("created_at");
  CREATE INDEX "event_createdAt_idx" ON "analytics_events" USING btree ("event","created_at");
  CREATE INDEX "visitorId_createdAt_idx" ON "analytics_events" USING btree ("visitor_id","created_at");
  CREATE INDEX "landing_createdAt_idx" ON "analytics_events" USING btree ("landing","created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_landings_id_idx" ON "payload_locked_documents_rels" USING btree ("landings_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_people_id_idx" ON "payload_locked_documents_rels" USING btree ("people_id");
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_analytics_events_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_events_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_phones_order_idx" ON "site_settings_phones" USING btree ("_order");
  CREATE INDEX "site_settings_phones_parent_id_idx" ON "site_settings_phones" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_phones_locales_locale_parent_id_unique" ON "site_settings_phones_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_phones_locales_parent_id_idx" ON "site_settings_phones_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_socials_order_idx" ON "site_settings_socials" USING btree ("_order");
  CREATE INDEX "site_settings_socials_parent_id_idx" ON "site_settings_socials" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_socials_locales_locale_parent_id_unique" ON "site_settings_socials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_socials_locales_parent_id_idx" ON "site_settings_socials_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings_active_landing_idx" ON "site_settings" USING btree ("active_landing_id");
  CREATE INDEX "site_settings_offer_offer_pdf_idx" ON "site_settings" USING btree ("offer_pdf_id");
  CREATE INDEX "site_settings_privacy_privacy_pdf_idx" ON "site_settings" USING btree ("privacy_pdf_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_locales_parent_id_idx" ON "site_settings_locales" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_phones_order_idx" ON "_site_settings_v_version_phones" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_phones_parent_id_idx" ON "_site_settings_v_version_phones" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_site_settings_v_version_phones_locales_locale_parent_id_uni" ON "_site_settings_v_version_phones_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_site_settings_v_version_phones_locales_parent_id_idx" ON "_site_settings_v_version_phones_locales" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_socials_order_idx" ON "_site_settings_v_version_socials" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_socials_parent_id_idx" ON "_site_settings_v_version_socials" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_site_settings_v_version_socials_locales_locale_parent_id_un" ON "_site_settings_v_version_socials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_site_settings_v_version_socials_locales_parent_id_idx" ON "_site_settings_v_version_socials_locales" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_version_logo_idx" ON "_site_settings_v" USING btree ("version_logo_id");
  CREATE INDEX "_site_settings_v_version_version_active_landing_idx" ON "_site_settings_v" USING btree ("version_active_landing_id");
  CREATE INDEX "_site_settings_v_version_offer_version_offer_pdf_idx" ON "_site_settings_v" USING btree ("version_offer_pdf_id");
  CREATE INDEX "_site_settings_v_version_privacy_version_privacy_pdf_idx" ON "_site_settings_v" USING btree ("version_privacy_pdf_id");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_site_settings_v_locales_locale_parent_id_unique" ON "_site_settings_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_site_settings_v_locales_parent_id_idx" ON "_site_settings_v_locales" USING btree ("_parent_id");
  CREATE INDEX "integrations_numbers_order_parent_idx" ON "integrations_numbers" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "leads_subjects" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "landings_hero_stats" CASCADE;
  DROP TABLE "landings_hero_stats_locales" CASCADE;
  DROP TABLE "landings_audience_cards" CASCADE;
  DROP TABLE "landings_audience_cards_locales" CASCADE;
  DROP TABLE "landings_audience_notes" CASCADE;
  DROP TABLE "landings_audience_notes_locales" CASCADE;
  DROP TABLE "landings_benefits_items" CASCADE;
  DROP TABLE "landings_benefits_items_locales" CASCADE;
  DROP TABLE "landings_gallery_images" CASCADE;
  DROP TABLE "landings_gallery_images_locales" CASCADE;
  DROP TABLE "landings_pricing_includes" CASCADE;
  DROP TABLE "landings_pricing_includes_locales" CASCADE;
  DROP TABLE "landings_history_milestones" CASCADE;
  DROP TABLE "landings_history_milestones_locales" CASCADE;
  DROP TABLE "landings_history_figures" CASCADE;
  DROP TABLE "landings_history_figures_locales" CASCADE;
  DROP TABLE "landings_history_prizes" CASCADE;
  DROP TABLE "landings_history_prizes_locales" CASCADE;
  DROP TABLE "landings_stories_items" CASCADE;
  DROP TABLE "landings_stories_items_locales" CASCADE;
  DROP TABLE "landings_faq_items" CASCADE;
  DROP TABLE "landings_faq_items_locales" CASCADE;
  DROP TABLE "landings_forms_how_heard_options" CASCADE;
  DROP TABLE "landings_forms_how_heard_options_locales" CASCADE;
  DROP TABLE "landings" CASCADE;
  DROP TABLE "landings_locales" CASCADE;
  DROP TABLE "landings_rels" CASCADE;
  DROP TABLE "_landings_v_version_hero_stats" CASCADE;
  DROP TABLE "_landings_v_version_hero_stats_locales" CASCADE;
  DROP TABLE "_landings_v_version_audience_cards" CASCADE;
  DROP TABLE "_landings_v_version_audience_cards_locales" CASCADE;
  DROP TABLE "_landings_v_version_audience_notes" CASCADE;
  DROP TABLE "_landings_v_version_audience_notes_locales" CASCADE;
  DROP TABLE "_landings_v_version_benefits_items" CASCADE;
  DROP TABLE "_landings_v_version_benefits_items_locales" CASCADE;
  DROP TABLE "_landings_v_version_gallery_images" CASCADE;
  DROP TABLE "_landings_v_version_gallery_images_locales" CASCADE;
  DROP TABLE "_landings_v_version_pricing_includes" CASCADE;
  DROP TABLE "_landings_v_version_pricing_includes_locales" CASCADE;
  DROP TABLE "_landings_v_version_history_milestones" CASCADE;
  DROP TABLE "_landings_v_version_history_milestones_locales" CASCADE;
  DROP TABLE "_landings_v_version_history_figures" CASCADE;
  DROP TABLE "_landings_v_version_history_figures_locales" CASCADE;
  DROP TABLE "_landings_v_version_history_prizes" CASCADE;
  DROP TABLE "_landings_v_version_history_prizes_locales" CASCADE;
  DROP TABLE "_landings_v_version_stories_items" CASCADE;
  DROP TABLE "_landings_v_version_stories_items_locales" CASCADE;
  DROP TABLE "_landings_v_version_faq_items" CASCADE;
  DROP TABLE "_landings_v_version_faq_items_locales" CASCADE;
  DROP TABLE "_landings_v_version_forms_how_heard_options" CASCADE;
  DROP TABLE "_landings_v_version_forms_how_heard_options_locales" CASCADE;
  DROP TABLE "_landings_v" CASCADE;
  DROP TABLE "_landings_v_locales" CASCADE;
  DROP TABLE "_landings_v_rels" CASCADE;
  DROP TABLE "events_subjects" CASCADE;
  DROP TABLE "events_program_items" CASCADE;
  DROP TABLE "events_program_items_locales" CASCADE;
  DROP TABLE "events_program" CASCADE;
  DROP TABLE "events_program_locales" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_locales" CASCADE;
  DROP TABLE "_events_v_version_subjects" CASCADE;
  DROP TABLE "_events_v_version_program_items" CASCADE;
  DROP TABLE "_events_v_version_program_items_locales" CASCADE;
  DROP TABLE "_events_v_version_program" CASCADE;
  DROP TABLE "_events_v_version_program_locales" CASCADE;
  DROP TABLE "_events_v" CASCADE;
  DROP TABLE "_events_v_locales" CASCADE;
  DROP TABLE "people_roles" CASCADE;
  DROP TABLE "people_subjects" CASCADE;
  DROP TABLE "people" CASCADE;
  DROP TABLE "people_locales" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "partners_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "analytics_events" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_phones" CASCADE;
  DROP TABLE "site_settings_phones_locales" CASCADE;
  DROP TABLE "site_settings_socials" CASCADE;
  DROP TABLE "site_settings_socials_locales" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "_site_settings_v_version_phones" CASCADE;
  DROP TABLE "_site_settings_v_version_phones_locales" CASCADE;
  DROP TABLE "_site_settings_v_version_socials" CASCADE;
  DROP TABLE "_site_settings_v_version_socials_locales" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP TABLE "_site_settings_v_locales" CASCADE;
  DROP TABLE "integrations" CASCADE;
  DROP TABLE "integrations_numbers" CASCADE;
  DROP TABLE "analytics_settings" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_leads_subjects";
  DROP TYPE "public"."enum_leads_type";
  DROP TYPE "public"."enum_leads_locale";
  DROP TYPE "public"."enum_leads_subject";
  DROP TYPE "public"."enum_leads_experience";
  DROP TYPE "public"."enum_leads_region";
  DROP TYPE "public"."enum_leads_amo_sync_status";
  DROP TYPE "public"."enum_landings_audience_cards_subject";
  DROP TYPE "public"."enum_landings_audience_notes_icon";
  DROP TYPE "public"."enum_landings_audience_notes_action";
  DROP TYPE "public"."enum_landings_benefits_items_icon";
  DROP TYPE "public"."enum_landings_history_milestones_kind";
  DROP TYPE "public"."enum__landings_v_version_audience_cards_subject";
  DROP TYPE "public"."enum__landings_v_version_audience_notes_icon";
  DROP TYPE "public"."enum__landings_v_version_audience_notes_action";
  DROP TYPE "public"."enum__landings_v_version_benefits_items_icon";
  DROP TYPE "public"."enum__landings_v_version_history_milestones_kind";
  DROP TYPE "public"."enum_events_subjects";
  DROP TYPE "public"."enum_events_type";
  DROP TYPE "public"."enum_events_level";
  DROP TYPE "public"."enum_events_format";
  DROP TYPE "public"."enum__events_v_version_subjects";
  DROP TYPE "public"."enum__events_v_version_type";
  DROP TYPE "public"."enum__events_v_version_level";
  DROP TYPE "public"."enum__events_v_version_format";
  DROP TYPE "public"."enum_people_roles";
  DROP TYPE "public"."enum_people_subjects";
  DROP TYPE "public"."enum_people_region";
  DROP TYPE "public"."enum_partners_kind";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_site_settings_socials_network";
  DROP TYPE "public"."enum__site_settings_v_version_socials_network";`)
}
