import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Сайт qmmq.kz, первая очередь: локаль en, коллекции news/materials/documents/pages/subscribers,
// глобалы home-page/about-page/partners-page, новые поля events/people/partners/leads.
// Столбцы leads.incomplete / complete_token и их индекс здесь убраны: их создаёт соседняя
// миграция 20261029_214830_add_lead_steps (двухшаговая регистрация).

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_leads_speaker_role" AS ENUM('speaker', 'jury', 'both');
  CREATE TYPE "public"."enum_leads_partner_format" AS ENUM('general_sponsor', 'sponsor', 'prizes', 'venue', 'media', 'other');
  CREATE TYPE "public"."enum_subscribers_locale" AS ENUM('ru', 'kk', 'en');
  CREATE TYPE "public"."enum_subscribers_subject" AS ENUM('math', 'physics', 'informatics');
  CREATE TYPE "public"."enum_subscribers_region" AS ENUM('astana', 'almaty', 'shymkent', 'abai', 'akmola', 'aktobe', 'almaty_region', 'atyrau', 'east_kazakhstan', 'zhambyl', 'zhetysu', 'west_kazakhstan', 'karaganda', 'kostanay', 'kyzylorda', 'mangystau', 'pavlodar', 'north_kazakhstan', 'turkistan', 'ulytau');
  CREATE TYPE "public"."enum_events_results_winners_place" AS ENUM('grand_prix', '1', '2', '3', 'special');
  CREATE TYPE "public"."enum_events_status_override" AS ENUM('auto', 'open', 'closed', 'finished');
  CREATE TYPE "public"."enum_events_region" AS ENUM('astana', 'almaty', 'shymkent', 'abai', 'akmola', 'aktobe', 'almaty_region', 'atyrau', 'east_kazakhstan', 'zhambyl', 'zhetysu', 'west_kazakhstan', 'karaganda', 'kostanay', 'kyzylorda', 'mangystau', 'pavlodar', 'north_kazakhstan', 'turkistan', 'ulytau');
  CREATE TYPE "public"."enum__events_v_version_results_winners_place" AS ENUM('grand_prix', '1', '2', '3', 'special');
  CREATE TYPE "public"."enum__events_v_version_status_override" AS ENUM('auto', 'open', 'closed', 'finished');
  CREATE TYPE "public"."enum__events_v_version_region" AS ENUM('astana', 'almaty', 'shymkent', 'abai', 'akmola', 'aktobe', 'almaty_region', 'atyrau', 'east_kazakhstan', 'zhambyl', 'zhetysu', 'west_kazakhstan', 'karaganda', 'kostanay', 'kyzylorda', 'mangystau', 'pavlodar', 'north_kazakhstan', 'turkistan', 'ulytau');
  CREATE TYPE "public"."enum_news_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_v_published_locale" AS ENUM('ru', 'kk', 'en');
  CREATE TYPE "public"."enum_materials_kind" AS ENUM('regulations', 'tasks', 'presentation', 'video', 'other');
  CREATE TYPE "public"."enum_materials_access" AS ENUM('public', 'registered', 'participants');
  CREATE TYPE "public"."enum_materials_subject" AS ENUM('math', 'physics', 'informatics');
  CREATE TYPE "public"."enum_documents_kind" AS ENUM('charter', 'certificate', 'gratitude', 'requisites', 'report', 'other');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('ru', 'kk', 'en');
  CREATE TYPE "public"."enum_partners_page_formats_icon" AS ENUM('Award', 'FileBadge', 'Hourglass', 'Building', 'GraduationCap', 'BookOpen', 'Brain', 'Calculator', 'Clock', 'Lightbulb', 'MessagesSquare', 'Mic', 'Sigma', 'Atom', 'Code', 'Trophy', 'Users', 'Handshake', 'Star', 'Target');
  CREATE TYPE "public"."enum__partners_page_v_version_formats_icon" AS ENUM('Award', 'FileBadge', 'Hourglass', 'Building', 'GraduationCap', 'BookOpen', 'Brain', 'Calculator', 'Clock', 'Lightbulb', 'MessagesSquare', 'Mic', 'Sigma', 'Atom', 'Code', 'Trophy', 'Users', 'Handshake', 'Star', 'Target');
  ALTER TYPE "public"."_locales" ADD VALUE 'en';
  ALTER TYPE "public"."enum_leads_type" ADD VALUE 'community';
  ALTER TYPE "public"."enum_leads_type" ADD VALUE 'speaker';
  ALTER TYPE "public"."enum_leads_type" ADD VALUE 'partner';
  ALTER TYPE "public"."enum_leads_type" ADD VALUE 'feedback';
  ALTER TYPE "public"."enum_leads_locale" ADD VALUE 'en';
  ALTER TYPE "public"."enum_leads_amo_sync_status" ADD VALUE 'skipped';
  CREATE TABLE "subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"locale" "enum_subscribers_locale" DEFAULT 'ru',
  	"subject" "enum_subscribers_subject",
  	"region" "enum_subscribers_region",
  	"active" boolean DEFAULT true,
  	"consent_at" timestamp(3) with time zone,
  	"source" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_results_winners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"place" "enum_events_results_winners_place" NOT NULL,
  	"person_id" integer,
  	"name" varchar
  );
  
  CREATE TABLE "events_results_winners_locales" (
  	"detail" varchar,
  	"prize" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "events_results_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "events_results_photos_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_events_v_version_results_winners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"place" "enum__events_v_version_results_winners_place" NOT NULL,
  	"person_id" integer,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_version_results_winners_locales" (
  	"detail" varchar,
  	"prize" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_events_v_version_results_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_version_results_photos_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "news_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "news_gallery_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "news" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"related_event_id" integer,
  	"cover_id" integer,
  	"source_name" varchar,
  	"source_url" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_news_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "news_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "news_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_news_v_version_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_news_v_version_gallery_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_news_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_related_event_id" integer,
  	"version_cover_id" integer,
  	"version_source_name" varchar,
  	"version_source_url" varchar,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__news_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__news_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_news_v_locales" (
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_news_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "materials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_materials_kind" DEFAULT 'other' NOT NULL,
  	"access" "enum_materials_access" DEFAULT 'public' NOT NULL,
  	"file_id" integer,
  	"video_url" varchar,
  	"subject" "enum_materials_subject",
  	"year" numeric,
  	"event_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "materials_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_documents_kind" DEFAULT 'other' NOT NULL,
  	"order" numeric DEFAULT 100,
  	"file_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "documents_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"show_in_en" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_show_in_en" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_title" varchar,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_featured_event_id" integer,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page_locales" (
  	"hero_heading" varchar,
  	"hero_lead" varchar,
  	"hero_primary_cta" varchar,
  	"hero_secondary_cta" varchar,
  	"about_heading" varchar,
  	"about_text" varchar,
  	"community_heading" varchar,
  	"community_text" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_featured_event_id" integer,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_home_page_v_locales" (
  	"version_hero_heading" varchar,
  	"version_hero_lead" varchar,
  	"version_hero_primary_cta" varchar,
  	"version_hero_secondary_cta" varchar,
  	"version_about_heading" varchar,
  	"version_about_text" varchar,
  	"version_community_heading" varchar,
  	"version_community_text" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "about_page_figures" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "about_page_figures_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_page_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" numeric NOT NULL,
  	"event_id" integer
  );
  
  CREATE TABLE "about_page_timeline_locales" (
  	"period" varchar,
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cover_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "about_page_locales" (
  	"heading" varchar,
  	"lead" varchar,
  	"mission" jsonb,
  	"history_heading" varchar,
  	"history_lead" varchar,
  	"team_heading" varchar,
  	"team_lead" varchar,
  	"documents_heading" varchar,
  	"documents_lead" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_about_page_v_version_figures" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_about_page_v_version_figures_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_about_page_v_version_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"year" numeric NOT NULL,
  	"event_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_about_page_v_version_timeline_locales" (
  	"period" varchar,
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_about_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_cover_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_about_page_v_locales" (
  	"version_heading" varchar,
  	"version_lead" varchar,
  	"version_mission" jsonb,
  	"version_history_heading" varchar,
  	"version_history_lead" varchar,
  	"version_team_heading" varchar,
  	"version_team_lead" varchar,
  	"version_documents_heading" varchar,
  	"version_documents_lead" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "partners_page_formats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_partners_page_formats_icon"
  );
  
  CREATE TABLE "partners_page_formats_locales" (
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "partners_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sponsor_pack_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "partners_page_locales" (
  	"heading" varchar,
  	"lead" varchar,
  	"past_partners_heading" varchar,
  	"contact_heading" varchar,
  	"contact_note" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_partners_page_v_version_formats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__partners_page_v_version_formats_icon",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_page_v_version_formats_locales" (
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_partners_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_sponsor_pack_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_partners_page_v_locales" (
  	"version_heading" varchar,
  	"version_lead" varchar,
  	"version_past_partners_heading" varchar,
  	"version_contact_heading" varchar,
  	"version_contact_note" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "leads" ADD COLUMN "speaker_role" "enum_leads_speaker_role";
  ALTER TABLE "leads" ADD COLUMN "topic" varchar;
  ALTER TABLE "leads" ADD COLUMN "partner_format" "enum_leads_partner_format";
  ALTER TABLE "leads" ADD COLUMN "wants_catalog" boolean;
  ALTER TABLE "leads" ADD COLUMN "message" varchar;
  ALTER TABLE "leads" ADD COLUMN "source_path" varchar;
  ALTER TABLE "events" ADD COLUMN "status_override" "enum_events_status_override" DEFAULT 'auto';
  ALTER TABLE "events" ADD COLUMN "contest_season" numeric;
  ALTER TABLE "events" ADD COLUMN "cover_id" integer;
  ALTER TABLE "events" ADD COLUMN "region" "enum_events_region";
  ALTER TABLE "events" ADD COLUMN "results_tasks_file_id" integer;
  ALTER TABLE "events_locales" ADD COLUMN "description" jsonb;
  ALTER TABLE "events_locales" ADD COLUMN "for_whom" varchar;
  ALTER TABLE "events_locales" ADD COLUMN "document_issued" varchar;
  ALTER TABLE "events_locales" ADD COLUMN "results_summary" varchar;
  ALTER TABLE "events_locales" ADD COLUMN "results_press_release" jsonb;
  ALTER TABLE "_events_v" ADD COLUMN "version_status_override" "enum__events_v_version_status_override" DEFAULT 'auto';
  ALTER TABLE "_events_v" ADD COLUMN "version_contest_season" numeric;
  ALTER TABLE "_events_v" ADD COLUMN "version_cover_id" integer;
  ALTER TABLE "_events_v" ADD COLUMN "version_region" "enum__events_v_version_region";
  ALTER TABLE "_events_v" ADD COLUMN "version_results_tasks_file_id" integer;
  ALTER TABLE "_events_v_locales" ADD COLUMN "version_description" jsonb;
  ALTER TABLE "_events_v_locales" ADD COLUMN "version_for_whom" varchar;
  ALTER TABLE "_events_v_locales" ADD COLUMN "version_document_issued" varchar;
  ALTER TABLE "_events_v_locales" ADD COLUMN "version_results_summary" varchar;
  ALTER TABLE "_events_v_locales" ADD COLUMN "version_results_press_release" jsonb;
  ALTER TABLE "people" ADD COLUMN "contact_email" varchar;
  ALTER TABLE "people" ADD COLUMN "contact_phone" varchar;
  ALTER TABLE "people" ADD COLUMN "contact_url" varchar;
  ALTER TABLE "people" ADD COLUMN "show_in_catalog" boolean DEFAULT false;
  ALTER TABLE "people_locales" ADD COLUMN "team_position" varchar;
  ALTER TABLE "people_locales" ADD COLUMN "bio" varchar;
  ALTER TABLE "people_locales" ADD COLUMN "quote" varchar;
  ALTER TABLE "partners" ADD COLUMN "show_on_partners_page" boolean DEFAULT false;
  ALTER TABLE "partners" ADD COLUMN "years" varchar;
  ALTER TABLE "partners_locales" ADD COLUMN "description" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subscribers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "news_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "materials_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "documents_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "events_results_winners" ADD CONSTRAINT "events_results_winners_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_results_winners" ADD CONSTRAINT "events_results_winners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_results_winners_locales" ADD CONSTRAINT "events_results_winners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_results_winners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_results_photos" ADD CONSTRAINT "events_results_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_results_photos" ADD CONSTRAINT "events_results_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_results_photos_locales" ADD CONSTRAINT "events_results_photos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_results_photos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_results_winners" ADD CONSTRAINT "_events_v_version_results_winners_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_version_results_winners" ADD CONSTRAINT "_events_v_version_results_winners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_results_winners_locales" ADD CONSTRAINT "_events_v_version_results_winners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v_version_results_winners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_results_photos" ADD CONSTRAINT "_events_v_version_results_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_version_results_photos" ADD CONSTRAINT "_events_v_version_results_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_results_photos_locales" ADD CONSTRAINT "_events_v_version_results_photos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v_version_results_photos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_gallery" ADD CONSTRAINT "news_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_gallery" ADD CONSTRAINT "news_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_gallery_locales" ADD CONSTRAINT "news_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_related_event_id_events_id_fk" FOREIGN KEY ("related_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_locales" ADD CONSTRAINT "news_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_texts" ADD CONSTRAINT "news_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_version_gallery" ADD CONSTRAINT "_news_v_version_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v_version_gallery" ADD CONSTRAINT "_news_v_version_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_version_gallery_locales" ADD CONSTRAINT "_news_v_version_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v_version_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_parent_id_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_related_event_id_events_id_fk" FOREIGN KEY ("version_related_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v_locales" ADD CONSTRAINT "_news_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_texts" ADD CONSTRAINT "_news_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "materials" ADD CONSTRAINT "materials_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "materials" ADD CONSTRAINT "materials_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "materials_locales" ADD CONSTRAINT "materials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "documents" ADD CONSTRAINT "documents_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documents_locales" ADD CONSTRAINT "documents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_hero_featured_event_id_events_id_fk" FOREIGN KEY ("hero_featured_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_locales" ADD CONSTRAINT "home_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_hero_featured_event_id_events_id_fk" FOREIGN KEY ("version_hero_featured_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_locales" ADD CONSTRAINT "_home_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_figures" ADD CONSTRAINT "about_page_figures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_figures_locales" ADD CONSTRAINT "about_page_figures_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page_figures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_timeline" ADD CONSTRAINT "about_page_timeline_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page_timeline" ADD CONSTRAINT "about_page_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_timeline_locales" ADD CONSTRAINT "about_page_timeline_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page" ADD CONSTRAINT "about_page_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page_locales" ADD CONSTRAINT "about_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_figures" ADD CONSTRAINT "_about_page_v_version_figures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_figures_locales" ADD CONSTRAINT "_about_page_v_version_figures_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v_version_figures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_timeline" ADD CONSTRAINT "_about_page_v_version_timeline_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_timeline" ADD CONSTRAINT "_about_page_v_version_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_timeline_locales" ADD CONSTRAINT "_about_page_v_version_timeline_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v_version_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v" ADD CONSTRAINT "_about_page_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v_locales" ADD CONSTRAINT "_about_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_page_formats" ADD CONSTRAINT "partners_page_formats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_page_formats_locales" ADD CONSTRAINT "partners_page_formats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_page_formats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_page" ADD CONSTRAINT "partners_page_sponsor_pack_id_media_id_fk" FOREIGN KEY ("sponsor_pack_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_page_locales" ADD CONSTRAINT "partners_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_page_v_version_formats" ADD CONSTRAINT "_partners_page_v_version_formats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_page_v_version_formats_locales" ADD CONSTRAINT "_partners_page_v_version_formats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_page_v_version_formats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_page_v" ADD CONSTRAINT "_partners_page_v_version_sponsor_pack_id_media_id_fk" FOREIGN KEY ("version_sponsor_pack_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_page_v_locales" ADD CONSTRAINT "_partners_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_page_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "subscribers_email_idx" ON "subscribers" USING btree ("email");
  CREATE INDEX "subscribers_active_idx" ON "subscribers" USING btree ("active");
  CREATE INDEX "subscribers_updated_at_idx" ON "subscribers" USING btree ("updated_at");
  CREATE INDEX "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");
  CREATE INDEX "events_results_winners_order_idx" ON "events_results_winners" USING btree ("_order");
  CREATE INDEX "events_results_winners_parent_id_idx" ON "events_results_winners" USING btree ("_parent_id");
  CREATE INDEX "events_results_winners_person_idx" ON "events_results_winners" USING btree ("person_id");
  CREATE UNIQUE INDEX "events_results_winners_locales_locale_parent_id_unique" ON "events_results_winners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_results_winners_locales_parent_id_idx" ON "events_results_winners_locales" USING btree ("_parent_id");
  CREATE INDEX "events_results_photos_order_idx" ON "events_results_photos" USING btree ("_order");
  CREATE INDEX "events_results_photos_parent_id_idx" ON "events_results_photos" USING btree ("_parent_id");
  CREATE INDEX "events_results_photos_image_idx" ON "events_results_photos" USING btree ("image_id");
  CREATE UNIQUE INDEX "events_results_photos_locales_locale_parent_id_unique" ON "events_results_photos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_results_photos_locales_parent_id_idx" ON "events_results_photos_locales" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_results_winners_order_idx" ON "_events_v_version_results_winners" USING btree ("_order");
  CREATE INDEX "_events_v_version_results_winners_parent_id_idx" ON "_events_v_version_results_winners" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_results_winners_person_idx" ON "_events_v_version_results_winners" USING btree ("person_id");
  CREATE UNIQUE INDEX "_events_v_version_results_winners_locales_locale_parent_id_u" ON "_events_v_version_results_winners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_version_results_winners_locales_parent_id_idx" ON "_events_v_version_results_winners_locales" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_results_photos_order_idx" ON "_events_v_version_results_photos" USING btree ("_order");
  CREATE INDEX "_events_v_version_results_photos_parent_id_idx" ON "_events_v_version_results_photos" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_results_photos_image_idx" ON "_events_v_version_results_photos" USING btree ("image_id");
  CREATE UNIQUE INDEX "_events_v_version_results_photos_locales_locale_parent_id_un" ON "_events_v_version_results_photos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_version_results_photos_locales_parent_id_idx" ON "_events_v_version_results_photos_locales" USING btree ("_parent_id");
  CREATE INDEX "news_gallery_order_idx" ON "news_gallery" USING btree ("_order");
  CREATE INDEX "news_gallery_parent_id_idx" ON "news_gallery" USING btree ("_parent_id");
  CREATE INDEX "news_gallery_image_idx" ON "news_gallery" USING btree ("image_id");
  CREATE UNIQUE INDEX "news_gallery_locales_locale_parent_id_unique" ON "news_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "news_gallery_locales_parent_id_idx" ON "news_gallery_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "news_slug_idx" ON "news" USING btree ("slug");
  CREATE INDEX "news_published_at_idx" ON "news" USING btree ("published_at");
  CREATE INDEX "news_related_event_idx" ON "news" USING btree ("related_event_id");
  CREATE INDEX "news_cover_idx" ON "news" USING btree ("cover_id");
  CREATE INDEX "news_seo_seo_og_image_idx" ON "news" USING btree ("seo_og_image_id");
  CREATE INDEX "news_updated_at_idx" ON "news" USING btree ("updated_at");
  CREATE INDEX "news_created_at_idx" ON "news" USING btree ("created_at");
  CREATE INDEX "news__status_idx" ON "news" USING btree ("_status");
  CREATE UNIQUE INDEX "news_locales_locale_parent_id_unique" ON "news_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "news_locales_parent_id_idx" ON "news_locales" USING btree ("_parent_id");
  CREATE INDEX "news_texts_order_parent" ON "news_texts" USING btree ("order","parent_id");
  CREATE INDEX "news_texts_text_idx" ON "news_texts" USING btree ("text");
  CREATE INDEX "_news_v_version_gallery_order_idx" ON "_news_v_version_gallery" USING btree ("_order");
  CREATE INDEX "_news_v_version_gallery_parent_id_idx" ON "_news_v_version_gallery" USING btree ("_parent_id");
  CREATE INDEX "_news_v_version_gallery_image_idx" ON "_news_v_version_gallery" USING btree ("image_id");
  CREATE UNIQUE INDEX "_news_v_version_gallery_locales_locale_parent_id_unique" ON "_news_v_version_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_news_v_version_gallery_locales_parent_id_idx" ON "_news_v_version_gallery_locales" USING btree ("_parent_id");
  CREATE INDEX "_news_v_parent_idx" ON "_news_v" USING btree ("parent_id");
  CREATE INDEX "_news_v_version_version_slug_idx" ON "_news_v" USING btree ("version_slug");
  CREATE INDEX "_news_v_version_version_published_at_idx" ON "_news_v" USING btree ("version_published_at");
  CREATE INDEX "_news_v_version_version_related_event_idx" ON "_news_v" USING btree ("version_related_event_id");
  CREATE INDEX "_news_v_version_version_cover_idx" ON "_news_v" USING btree ("version_cover_id");
  CREATE INDEX "_news_v_version_seo_version_seo_og_image_idx" ON "_news_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_news_v_version_version_updated_at_idx" ON "_news_v" USING btree ("version_updated_at");
  CREATE INDEX "_news_v_version_version_created_at_idx" ON "_news_v" USING btree ("version_created_at");
  CREATE INDEX "_news_v_version_version__status_idx" ON "_news_v" USING btree ("version__status");
  CREATE INDEX "_news_v_created_at_idx" ON "_news_v" USING btree ("created_at");
  CREATE INDEX "_news_v_updated_at_idx" ON "_news_v" USING btree ("updated_at");
  CREATE INDEX "_news_v_snapshot_idx" ON "_news_v" USING btree ("snapshot");
  CREATE INDEX "_news_v_published_locale_idx" ON "_news_v" USING btree ("published_locale");
  CREATE INDEX "_news_v_latest_idx" ON "_news_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_news_v_locales_locale_parent_id_unique" ON "_news_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_news_v_locales_parent_id_idx" ON "_news_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_news_v_texts_order_parent" ON "_news_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "materials_access_idx" ON "materials" USING btree ("access");
  CREATE INDEX "materials_file_idx" ON "materials" USING btree ("file_id");
  CREATE INDEX "materials_year_idx" ON "materials" USING btree ("year");
  CREATE INDEX "materials_event_idx" ON "materials" USING btree ("event_id");
  CREATE INDEX "materials_updated_at_idx" ON "materials" USING btree ("updated_at");
  CREATE INDEX "materials_created_at_idx" ON "materials" USING btree ("created_at");
  CREATE UNIQUE INDEX "materials_locales_locale_parent_id_unique" ON "materials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "materials_locales_parent_id_idx" ON "materials_locales" USING btree ("_parent_id");
  CREATE INDEX "documents_file_idx" ON "documents" USING btree ("file_id");
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "documents_locales_locale_parent_id_unique" ON "documents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "documents_locales_parent_id_idx" ON "documents_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_locales_parent_id_idx" ON "pages_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_locales_parent_id_idx" ON "_pages_v_locales" USING btree ("_parent_id");
  CREATE INDEX "home_page_hero_hero_featured_event_idx" ON "home_page" USING btree ("hero_featured_event_id");
  CREATE INDEX "home_page_seo_seo_og_image_idx" ON "home_page" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "home_page_locales_locale_parent_id_unique" ON "home_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_locales_parent_id_idx" ON "home_page_locales" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_hero_version_hero_featured_event_idx" ON "_home_page_v" USING btree ("version_hero_featured_event_id");
  CREATE INDEX "_home_page_v_version_seo_version_seo_og_image_idx" ON "_home_page_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_home_page_v_created_at_idx" ON "_home_page_v" USING btree ("created_at");
  CREATE INDEX "_home_page_v_updated_at_idx" ON "_home_page_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_home_page_v_locales_locale_parent_id_unique" ON "_home_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_home_page_v_locales_parent_id_idx" ON "_home_page_v_locales" USING btree ("_parent_id");
  CREATE INDEX "about_page_figures_order_idx" ON "about_page_figures" USING btree ("_order");
  CREATE INDEX "about_page_figures_parent_id_idx" ON "about_page_figures" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_page_figures_locales_locale_parent_id_unique" ON "about_page_figures_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_page_figures_locales_parent_id_idx" ON "about_page_figures_locales" USING btree ("_parent_id");
  CREATE INDEX "about_page_timeline_order_idx" ON "about_page_timeline" USING btree ("_order");
  CREATE INDEX "about_page_timeline_parent_id_idx" ON "about_page_timeline" USING btree ("_parent_id");
  CREATE INDEX "about_page_timeline_event_idx" ON "about_page_timeline" USING btree ("event_id");
  CREATE UNIQUE INDEX "about_page_timeline_locales_locale_parent_id_unique" ON "about_page_timeline_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_page_timeline_locales_parent_id_idx" ON "about_page_timeline_locales" USING btree ("_parent_id");
  CREATE INDEX "about_page_cover_idx" ON "about_page" USING btree ("cover_id");
  CREATE UNIQUE INDEX "about_page_locales_locale_parent_id_unique" ON "about_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_page_locales_parent_id_idx" ON "about_page_locales" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_figures_order_idx" ON "_about_page_v_version_figures" USING btree ("_order");
  CREATE INDEX "_about_page_v_version_figures_parent_id_idx" ON "_about_page_v_version_figures" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_about_page_v_version_figures_locales_locale_parent_id_uniqu" ON "_about_page_v_version_figures_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_about_page_v_version_figures_locales_parent_id_idx" ON "_about_page_v_version_figures_locales" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_timeline_order_idx" ON "_about_page_v_version_timeline" USING btree ("_order");
  CREATE INDEX "_about_page_v_version_timeline_parent_id_idx" ON "_about_page_v_version_timeline" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_timeline_event_idx" ON "_about_page_v_version_timeline" USING btree ("event_id");
  CREATE UNIQUE INDEX "_about_page_v_version_timeline_locales_locale_parent_id_uniq" ON "_about_page_v_version_timeline_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_about_page_v_version_timeline_locales_parent_id_idx" ON "_about_page_v_version_timeline_locales" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_version_cover_idx" ON "_about_page_v" USING btree ("version_cover_id");
  CREATE INDEX "_about_page_v_created_at_idx" ON "_about_page_v" USING btree ("created_at");
  CREATE INDEX "_about_page_v_updated_at_idx" ON "_about_page_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_about_page_v_locales_locale_parent_id_unique" ON "_about_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_about_page_v_locales_parent_id_idx" ON "_about_page_v_locales" USING btree ("_parent_id");
  CREATE INDEX "partners_page_formats_order_idx" ON "partners_page_formats" USING btree ("_order");
  CREATE INDEX "partners_page_formats_parent_id_idx" ON "partners_page_formats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "partners_page_formats_locales_locale_parent_id_unique" ON "partners_page_formats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "partners_page_formats_locales_parent_id_idx" ON "partners_page_formats_locales" USING btree ("_parent_id");
  CREATE INDEX "partners_page_sponsor_pack_idx" ON "partners_page" USING btree ("sponsor_pack_id");
  CREATE UNIQUE INDEX "partners_page_locales_locale_parent_id_unique" ON "partners_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "partners_page_locales_parent_id_idx" ON "partners_page_locales" USING btree ("_parent_id");
  CREATE INDEX "_partners_page_v_version_formats_order_idx" ON "_partners_page_v_version_formats" USING btree ("_order");
  CREATE INDEX "_partners_page_v_version_formats_parent_id_idx" ON "_partners_page_v_version_formats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_partners_page_v_version_formats_locales_locale_parent_id_un" ON "_partners_page_v_version_formats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_partners_page_v_version_formats_locales_parent_id_idx" ON "_partners_page_v_version_formats_locales" USING btree ("_parent_id");
  CREATE INDEX "_partners_page_v_version_version_sponsor_pack_idx" ON "_partners_page_v" USING btree ("version_sponsor_pack_id");
  CREATE INDEX "_partners_page_v_created_at_idx" ON "_partners_page_v" USING btree ("created_at");
  CREATE INDEX "_partners_page_v_updated_at_idx" ON "_partners_page_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_partners_page_v_locales_locale_parent_id_unique" ON "_partners_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_partners_page_v_locales_parent_id_idx" ON "_partners_page_v_locales" USING btree ("_parent_id");
  ALTER TABLE "events" ADD CONSTRAINT "events_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_results_tasks_file_id_media_id_fk" FOREIGN KEY ("results_tasks_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_results_tasks_file_id_media_id_fk" FOREIGN KEY ("version_results_tasks_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk" FOREIGN KEY ("subscribers_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_materials_fk" FOREIGN KEY ("materials_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_contest_season_idx" ON "events" USING btree ("contest_season");
  CREATE INDEX "events_cover_idx" ON "events" USING btree ("cover_id");
  CREATE INDEX "events_region_idx" ON "events" USING btree ("region");
  CREATE INDEX "events_results_results_tasks_file_idx" ON "events" USING btree ("results_tasks_file_id");
  CREATE INDEX "_events_v_version_version_contest_season_idx" ON "_events_v" USING btree ("version_contest_season");
  CREATE INDEX "_events_v_version_version_cover_idx" ON "_events_v" USING btree ("version_cover_id");
  CREATE INDEX "_events_v_version_version_region_idx" ON "_events_v" USING btree ("version_region");
  CREATE INDEX "_events_v_version_results_version_results_tasks_file_idx" ON "_events_v" USING btree ("version_results_tasks_file_id");
  CREATE INDEX "people_show_in_catalog_idx" ON "people" USING btree ("show_in_catalog");
  CREATE INDEX "partners_show_on_partners_page_idx" ON "partners" USING btree ("show_on_partners_page");
  CREATE INDEX "payload_locked_documents_rels_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("subscribers_id");
  CREATE INDEX "payload_locked_documents_rels_news_id_idx" ON "payload_locked_documents_rels" USING btree ("news_id");
  CREATE INDEX "payload_locked_documents_rels_materials_id_idx" ON "payload_locked_documents_rels" USING btree ("materials_id");
  CREATE INDEX "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscribers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_results_winners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_results_winners_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_results_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_results_photos_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v_version_results_winners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v_version_results_winners_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v_version_results_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v_version_results_photos_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "news_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "news_gallery_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "news" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "news_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "news_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_news_v_version_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_news_v_version_gallery_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_news_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_news_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_news_v_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "materials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "materials_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "documents_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_figures" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_figures_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_timeline_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_version_figures" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_version_figures_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_version_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_version_timeline_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_page_formats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_page_formats_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_page_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_page_v_version_formats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_page_v_version_formats_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_page_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_page_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "subscribers" CASCADE;
  DROP TABLE "events_results_winners" CASCADE;
  DROP TABLE "events_results_winners_locales" CASCADE;
  DROP TABLE "events_results_photos" CASCADE;
  DROP TABLE "events_results_photos_locales" CASCADE;
  DROP TABLE "_events_v_version_results_winners" CASCADE;
  DROP TABLE "_events_v_version_results_winners_locales" CASCADE;
  DROP TABLE "_events_v_version_results_photos" CASCADE;
  DROP TABLE "_events_v_version_results_photos_locales" CASCADE;
  DROP TABLE "news_gallery" CASCADE;
  DROP TABLE "news_gallery_locales" CASCADE;
  DROP TABLE "news" CASCADE;
  DROP TABLE "news_locales" CASCADE;
  DROP TABLE "news_texts" CASCADE;
  DROP TABLE "_news_v_version_gallery" CASCADE;
  DROP TABLE "_news_v_version_gallery_locales" CASCADE;
  DROP TABLE "_news_v" CASCADE;
  DROP TABLE "_news_v_locales" CASCADE;
  DROP TABLE "_news_v_texts" CASCADE;
  DROP TABLE "materials" CASCADE;
  DROP TABLE "materials_locales" CASCADE;
  DROP TABLE "documents" CASCADE;
  DROP TABLE "documents_locales" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "home_page_locales" CASCADE;
  DROP TABLE "_home_page_v" CASCADE;
  DROP TABLE "_home_page_v_locales" CASCADE;
  DROP TABLE "about_page_figures" CASCADE;
  DROP TABLE "about_page_figures_locales" CASCADE;
  DROP TABLE "about_page_timeline" CASCADE;
  DROP TABLE "about_page_timeline_locales" CASCADE;
  DROP TABLE "about_page" CASCADE;
  DROP TABLE "about_page_locales" CASCADE;
  DROP TABLE "_about_page_v_version_figures" CASCADE;
  DROP TABLE "_about_page_v_version_figures_locales" CASCADE;
  DROP TABLE "_about_page_v_version_timeline" CASCADE;
  DROP TABLE "_about_page_v_version_timeline_locales" CASCADE;
  DROP TABLE "_about_page_v" CASCADE;
  DROP TABLE "_about_page_v_locales" CASCADE;
  DROP TABLE "partners_page_formats" CASCADE;
  DROP TABLE "partners_page_formats_locales" CASCADE;
  DROP TABLE "partners_page" CASCADE;
  DROP TABLE "partners_page_locales" CASCADE;
  DROP TABLE "_partners_page_v_version_formats" CASCADE;
  DROP TABLE "_partners_page_v_version_formats_locales" CASCADE;
  DROP TABLE "_partners_page_v" CASCADE;
  DROP TABLE "_partners_page_v_locales" CASCADE;
  ALTER TABLE "events" DROP CONSTRAINT "events_cover_id_media_id_fk";
  
  ALTER TABLE "events" DROP CONSTRAINT "events_results_tasks_file_id_media_id_fk";
  
  ALTER TABLE "_events_v" DROP CONSTRAINT "_events_v_version_cover_id_media_id_fk";
  
  ALTER TABLE "_events_v" DROP CONSTRAINT "_events_v_version_results_tasks_file_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subscribers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_news_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_materials_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_documents_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
  
  ALTER TABLE "landings_hero_stats_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "landings_audience_cards_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "landings_audience_notes_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "landings_benefits_items_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "landings_gallery_images_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "landings_pricing_includes_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "landings_history_milestones_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "landings_history_figures_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "landings_history_prizes_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "landings_stories_items_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "landings_faq_items_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "landings_forms_how_heard_options_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "landings_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_landings_v_version_hero_stats_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_landings_v_version_audience_cards_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_landings_v_version_audience_notes_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_landings_v_version_benefits_items_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_landings_v_version_gallery_images_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_landings_v_version_pricing_includes_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_landings_v_version_history_milestones_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_landings_v_version_history_figures_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_landings_v_version_history_prizes_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_landings_v_version_stories_items_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_landings_v_version_faq_items_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_landings_v_version_forms_how_heard_options_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_landings_v_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "events_program_items_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "events_program_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "events_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_events_v_version_program_items_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_events_v_version_program_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_events_v_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "people_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "partners_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "media_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "site_settings_phones_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "site_settings_socials_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "site_settings_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_site_settings_v_version_phones_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_site_settings_v_version_socials_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_site_settings_v_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  DROP TYPE "public"."_locales";
  CREATE TYPE "public"."_locales" AS ENUM('ru', 'kk');
  ALTER TABLE "landings_hero_stats_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "landings_audience_cards_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "landings_audience_notes_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "landings_benefits_items_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "landings_gallery_images_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "landings_pricing_includes_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "landings_history_milestones_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "landings_history_figures_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "landings_history_prizes_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "landings_stories_items_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "landings_faq_items_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "landings_forms_how_heard_options_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "landings_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_landings_v_version_hero_stats_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_landings_v_version_audience_cards_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_landings_v_version_audience_notes_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_landings_v_version_benefits_items_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_landings_v_version_gallery_images_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_landings_v_version_pricing_includes_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_landings_v_version_history_milestones_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_landings_v_version_history_figures_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_landings_v_version_history_prizes_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_landings_v_version_stories_items_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_landings_v_version_faq_items_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_landings_v_version_forms_how_heard_options_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_landings_v_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "events_program_items_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "events_program_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "events_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_events_v_version_program_items_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_events_v_version_program_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_events_v_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "people_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "partners_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "media_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "site_settings_phones_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "site_settings_socials_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "site_settings_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_site_settings_v_version_phones_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_site_settings_v_version_socials_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_site_settings_v_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "leads" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_leads_type";
  CREATE TYPE "public"."enum_leads_type" AS ENUM('registration', 'waitlist', 'school', 'regulations');
  ALTER TABLE "leads" ALTER COLUMN "type" SET DATA TYPE "public"."enum_leads_type" USING "type"::"public"."enum_leads_type";
  ALTER TABLE "leads" ALTER COLUMN "locale" SET DATA TYPE text;
  ALTER TABLE "leads" ALTER COLUMN "locale" SET DEFAULT 'ru'::text;
  DROP TYPE "public"."enum_leads_locale";
  CREATE TYPE "public"."enum_leads_locale" AS ENUM('ru', 'kk');
  ALTER TABLE "leads" ALTER COLUMN "locale" SET DEFAULT 'ru'::"public"."enum_leads_locale";
  ALTER TABLE "leads" ALTER COLUMN "locale" SET DATA TYPE "public"."enum_leads_locale" USING "locale"::"public"."enum_leads_locale";
  ALTER TABLE "leads" ALTER COLUMN "amo_sync_status" SET DATA TYPE text;
  ALTER TABLE "leads" ALTER COLUMN "amo_sync_status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_leads_amo_sync_status";
  CREATE TYPE "public"."enum_leads_amo_sync_status" AS ENUM('pending', 'sent', 'failed', 'disabled');
  ALTER TABLE "leads" ALTER COLUMN "amo_sync_status" SET DEFAULT 'pending'::"public"."enum_leads_amo_sync_status";
  ALTER TABLE "leads" ALTER COLUMN "amo_sync_status" SET DATA TYPE "public"."enum_leads_amo_sync_status" USING "amo_sync_status"::"public"."enum_leads_amo_sync_status";
  DROP INDEX "events_contest_season_idx";
  DROP INDEX "events_cover_idx";
  DROP INDEX "events_region_idx";
  DROP INDEX "events_results_results_tasks_file_idx";
  DROP INDEX "_events_v_version_version_contest_season_idx";
  DROP INDEX "_events_v_version_version_cover_idx";
  DROP INDEX "_events_v_version_version_region_idx";
  DROP INDEX "_events_v_version_results_version_results_tasks_file_idx";
  DROP INDEX "people_show_in_catalog_idx";
  DROP INDEX "partners_show_on_partners_page_idx";
  DROP INDEX "payload_locked_documents_rels_subscribers_id_idx";
  DROP INDEX "payload_locked_documents_rels_news_id_idx";
  DROP INDEX "payload_locked_documents_rels_materials_id_idx";
  DROP INDEX "payload_locked_documents_rels_documents_id_idx";
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  ALTER TABLE "leads" DROP COLUMN "speaker_role";
  ALTER TABLE "leads" DROP COLUMN "topic";
  ALTER TABLE "leads" DROP COLUMN "partner_format";
  ALTER TABLE "leads" DROP COLUMN "wants_catalog";
  ALTER TABLE "leads" DROP COLUMN "message";
  ALTER TABLE "leads" DROP COLUMN "source_path";
  ALTER TABLE "events" DROP COLUMN "status_override";
  ALTER TABLE "events" DROP COLUMN "contest_season";
  ALTER TABLE "events" DROP COLUMN "cover_id";
  ALTER TABLE "events" DROP COLUMN "region";
  ALTER TABLE "events" DROP COLUMN "results_tasks_file_id";
  ALTER TABLE "events_locales" DROP COLUMN "description";
  ALTER TABLE "events_locales" DROP COLUMN "for_whom";
  ALTER TABLE "events_locales" DROP COLUMN "document_issued";
  ALTER TABLE "events_locales" DROP COLUMN "results_summary";
  ALTER TABLE "events_locales" DROP COLUMN "results_press_release";
  ALTER TABLE "_events_v" DROP COLUMN "version_status_override";
  ALTER TABLE "_events_v" DROP COLUMN "version_contest_season";
  ALTER TABLE "_events_v" DROP COLUMN "version_cover_id";
  ALTER TABLE "_events_v" DROP COLUMN "version_region";
  ALTER TABLE "_events_v" DROP COLUMN "version_results_tasks_file_id";
  ALTER TABLE "_events_v_locales" DROP COLUMN "version_description";
  ALTER TABLE "_events_v_locales" DROP COLUMN "version_for_whom";
  ALTER TABLE "_events_v_locales" DROP COLUMN "version_document_issued";
  ALTER TABLE "_events_v_locales" DROP COLUMN "version_results_summary";
  ALTER TABLE "_events_v_locales" DROP COLUMN "version_results_press_release";
  ALTER TABLE "people" DROP COLUMN "contact_email";
  ALTER TABLE "people" DROP COLUMN "contact_phone";
  ALTER TABLE "people" DROP COLUMN "contact_url";
  ALTER TABLE "people" DROP COLUMN "show_in_catalog";
  ALTER TABLE "people_locales" DROP COLUMN "team_position";
  ALTER TABLE "people_locales" DROP COLUMN "bio";
  ALTER TABLE "people_locales" DROP COLUMN "quote";
  ALTER TABLE "partners" DROP COLUMN "show_on_partners_page";
  ALTER TABLE "partners" DROP COLUMN "years";
  ALTER TABLE "partners_locales" DROP COLUMN "description";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "subscribers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "news_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "materials_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "documents_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  DROP TYPE "public"."enum_leads_speaker_role";
  DROP TYPE "public"."enum_leads_partner_format";
  DROP TYPE "public"."enum_subscribers_locale";
  DROP TYPE "public"."enum_subscribers_subject";
  DROP TYPE "public"."enum_subscribers_region";
  DROP TYPE "public"."enum_events_results_winners_place";
  DROP TYPE "public"."enum_events_status_override";
  DROP TYPE "public"."enum_events_region";
  DROP TYPE "public"."enum__events_v_version_results_winners_place";
  DROP TYPE "public"."enum__events_v_version_status_override";
  DROP TYPE "public"."enum__events_v_version_region";
  DROP TYPE "public"."enum_news_status";
  DROP TYPE "public"."enum__news_v_version_status";
  DROP TYPE "public"."enum__news_v_published_locale";
  DROP TYPE "public"."enum_materials_kind";
  DROP TYPE "public"."enum_materials_access";
  DROP TYPE "public"."enum_materials_subject";
  DROP TYPE "public"."enum_documents_kind";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum_partners_page_formats_icon";
  DROP TYPE "public"."enum__partners_page_v_version_formats_icon";`)
}
