CREATE TABLE "kg_concepts" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"unit_id" text,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"definition" text,
	"definition_note" text,
	"slide_excerpt" text,
	"equations" jsonb DEFAULT '[]'::jsonb,
	"equations_verified" boolean,
	"sources" jsonb DEFAULT '[]'::jsonb,
	"embedding" vector(1536),
	"embedding_source_hash" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kg_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"source_folder_url" text,
	"gap_report" text,
	"generated_at" timestamp with time zone,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kg_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" text NOT NULL,
	"source_id" text NOT NULL,
	"target_id" text NOT NULL,
	"relation" text NOT NULL,
	"basis" text NOT NULL,
	"note" text,
	"evidence" jsonb,
	"cross_unit" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kg_units" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"number" integer,
	"name" text NOT NULL,
	"chapter" text,
	"slug" text NOT NULL,
	"files" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "problem_concepts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" text NOT NULL,
	"concept_id" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"tagged_by" text NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "problem_concepts_tagged_by_check" CHECK ("problem_concepts"."tagged_by" in ('manual', 'ai'))
);
--> statement-breakpoint
ALTER TABLE "kg_concepts" ADD CONSTRAINT "kg_concepts_course_id_kg_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."kg_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_concepts" ADD CONSTRAINT "kg_concepts_unit_id_kg_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."kg_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_edges" ADD CONSTRAINT "kg_edges_course_id_kg_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."kg_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_edges" ADD CONSTRAINT "kg_edges_source_id_kg_concepts_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."kg_concepts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_edges" ADD CONSTRAINT "kg_edges_target_id_kg_concepts_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."kg_concepts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_units" ADD CONSTRAINT "kg_units_course_id_kg_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."kg_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_concepts" ADD CONSTRAINT "problem_concepts_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_concepts" ADD CONSTRAINT "problem_concepts_concept_id_kg_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."kg_concepts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "kg_concepts_course_slug_unique" ON "kg_concepts" USING btree ("course_id","slug");--> statement-breakpoint
CREATE INDEX "kg_concepts_course_id_idx" ON "kg_concepts" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "kg_concepts_unit_id_idx" ON "kg_concepts" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "kg_concepts_embedding_idx" ON "kg_concepts" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "kg_courses_subject_idx" ON "kg_courses" USING btree ("subject");--> statement-breakpoint
CREATE UNIQUE INDEX "kg_edges_source_target_relation_unique" ON "kg_edges" USING btree ("source_id","target_id","relation");--> statement-breakpoint
CREATE INDEX "kg_edges_course_id_idx" ON "kg_edges" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "kg_edges_source_id_idx" ON "kg_edges" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "kg_edges_target_id_idx" ON "kg_edges" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "kg_units_course_id_idx" ON "kg_units" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "kg_units_course_slug_unique" ON "kg_units" USING btree ("course_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "problem_concepts_problem_id_concept_id_unique" ON "problem_concepts" USING btree ("problem_id","concept_id");--> statement-breakpoint
CREATE INDEX "problem_concepts_concept_id_idx" ON "problem_concepts" USING btree ("concept_id");--> statement-breakpoint
CREATE INDEX "problem_concepts_problem_id_idx" ON "problem_concepts" USING btree ("problem_id");