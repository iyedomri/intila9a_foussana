-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DIRECTOR', 'TEACHER', 'STUDENT', 'PARENT');
CREATE TYPE "PostType" AS ENUM ('EXERCISE', 'EXAM', 'LESSON_NOTE');
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "EventAudience" AS ENUM ('TEACHERS', 'STUDENTS_AND_PARENTS', 'ALL');
CREATE TYPE "FileScanStatus" AS ENUM ('PENDING', 'CLEAN', 'REJECTED');
CREATE TYPE "NotificationType" AS ENUM ('POST_PUBLISHED', 'POST_UPDATED', 'EVENT_PUBLISHED', 'MODERATION', 'ACCOUNT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" "Role" NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "username" VARCHAR(64),
    "password_hash" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "login_locked_until" TIMESTAMPTZ(3),
    "last_login_at" TIMESTAMPTZ(3),
    "session_version" INTEGER NOT NULL DEFAULT 0,
    "totp_secret_encrypted" TEXT,
    "totp_enabled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_email_lowercase_check" CHECK ("email" = lower("email")),
    CONSTRAINT "users_username_lowercase_check" CHECK ("username" IS NULL OR "username" = lower("username")),
    CONSTRAINT "users_failed_login_attempts_check" CHECK ("failed_login_attempts" >= 0),
    CONSTRAINT "users_totp_pair_check" CHECK (("totp_secret_encrypted" IS NULL) = ("totp_enabled_at" IS NULL))
);

CREATE TABLE "grades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "level" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "grades_level_check" CHECK ("level" BETWEEN 1 AND 6)
);

CREATE TABLE "school_classes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grade_id" UUID NOT NULL,
    "name" VARCHAR(24) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_classes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "school_classes_name_not_blank_check" CHECK (length(btrim("name")) > 0)
);

CREATE TABLE "subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(80) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subjects_name_not_blank_check" CHECK (length(btrim("name")) > 0)
);

CREATE TABLE "teacher_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "teacher_id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "class_id" UUID,
    "subject_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "student_profiles" (
    "user_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "parent_students" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parent_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_students_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "parent_students_different_people_check" CHECK ("parent_id" <> "student_id")
);

CREATE TABLE "posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_id" UUID NOT NULL,
    "type" "PostType" NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "subject_id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "class_id" UUID,
    "due_date" TIMESTAMPTZ(3),
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "deleted_at" TIMESTAMPTZ(3),
    "deleted_by_id" UUID,
    "delete_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "posts_title_not_blank_check" CHECK (length(btrim("title")) > 0),
    CONSTRAINT "posts_soft_delete_audit_check" CHECK (
      ("deleted_at" IS NULL AND "deleted_by_id" IS NULL AND "delete_reason" IS NULL)
      OR
      ("deleted_at" IS NOT NULL AND "deleted_by_id" IS NOT NULL AND length(btrim("delete_reason")) > 0)
    )
);

CREATE TABLE "post_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "post_id" UUID NOT NULL,
    "storage_key" VARCHAR(512) NOT NULL,
    "mime_type" VARCHAR(127) NOT NULL,
    "size" INTEGER NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "scan_status" "FileScanStatus" NOT NULL DEFAULT 'PENDING',
    "scanned_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_files_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "post_files_size_check" CHECK ("size" > 0),
    CONSTRAINT "post_files_name_not_blank_check" CHECK (length(btrim("original_name")) > 0),
    CONSTRAINT "post_files_scan_state_check" CHECK (
      ("scan_status" = 'PENDING' AND "scanned_at" IS NULL)
      OR ("scan_status" IN ('CLEAN', 'REJECTED') AND "scanned_at" IS NOT NULL)
    )
);

CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "audience" "EventAudience" NOT NULL,
    "grade_id" UUID,
    "deleted_at" TIMESTAMPTZ(3),
    "deleted_by_id" UUID,
    "delete_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "events_title_not_blank_check" CHECK (length(btrim("title")) > 0),
    CONSTRAINT "events_time_range_check" CHECK ("ends_at" >= "starts_at"),
    CONSTRAINT "events_soft_delete_audit_check" CHECK (
      ("deleted_at" IS NULL AND "deleted_by_id" IS NULL AND "delete_reason" IS NULL)
      OR
      ("deleted_at" IS NOT NULL AND "deleted_by_id" IS NOT NULL AND length(btrim("delete_reason")) > 0)
    )
);

CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "ref_id" UUID NOT NULL,
    "read_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "entity" VARCHAR(80) NOT NULL,
    "entity_id" UUID NOT NULL,
    "ip" INET,
    "user_agent" VARCHAR(512),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "password_reset_tokens_expiry_check" CHECK ("expires_at" > "created_at")
);

CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "session_version" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "idle_expires_at" TIMESTAMPTZ(3) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" INET,
    "user_agent" VARCHAR(512),
    "revoked_at" TIMESTAMPTZ(3),
    "revoke_reason" VARCHAR(100),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sessions_expiry_check" CHECK ("expires_at" > "created_at" AND "idle_expires_at" > "created_at"),
    CONSTRAINT "sessions_revocation_reason_check" CHECK (
      ("revoked_at" IS NULL AND "revoke_reason" IS NULL)
      OR ("revoked_at" IS NOT NULL AND length(btrim("revoke_reason")) > 0)
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");
CREATE UNIQUE INDEX "grades_level_key" ON "grades"("level");
CREATE UNIQUE INDEX "school_classes_grade_id_name_key" ON "school_classes"("grade_id", "name");
CREATE INDEX "school_classes_grade_id_is_active_idx" ON "school_classes"("grade_id", "is_active");
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");
CREATE INDEX "teacher_assignments_teacher_id_grade_id_subject_id_idx" ON "teacher_assignments"("teacher_id", "grade_id", "subject_id");
CREATE INDEX "teacher_assignments_class_id_idx" ON "teacher_assignments"("class_id");
CREATE UNIQUE INDEX "teacher_assignments_grade_scope_key"
  ON "teacher_assignments"("teacher_id", "grade_id", "subject_id")
  WHERE "class_id" IS NULL;
CREATE UNIQUE INDEX "teacher_assignments_class_scope_key"
  ON "teacher_assignments"("teacher_id", "class_id", "subject_id")
  WHERE "class_id" IS NOT NULL;
CREATE INDEX "student_profiles_class_id_idx" ON "student_profiles"("class_id");
CREATE UNIQUE INDEX "parent_students_parent_id_student_id_key" ON "parent_students"("parent_id", "student_id");
CREATE INDEX "parent_students_student_id_idx" ON "parent_students"("student_id");
CREATE INDEX "posts_author_id_created_at_idx" ON "posts"("author_id", "created_at");
CREATE INDEX "posts_grade_id_class_id_subject_id_type_due_date_idx" ON "posts"("grade_id", "class_id", "subject_id", "type", "due_date");
CREATE INDEX "posts_deleted_at_status_created_at_idx" ON "posts"("deleted_at", "status", "created_at");
CREATE INDEX "posts_published_feed_idx"
  ON "posts"("grade_id", "class_id", "subject_id", "type", "due_date", "created_at" DESC)
  WHERE "deleted_at" IS NULL AND "status" = 'PUBLISHED';
CREATE UNIQUE INDEX "post_files_storage_key_key" ON "post_files"("storage_key");
CREATE INDEX "post_files_post_id_scan_status_idx" ON "post_files"("post_id", "scan_status");
CREATE INDEX "events_audience_grade_id_starts_at_idx" ON "events"("audience", "grade_id", "starts_at");
CREATE INDEX "events_deleted_at_starts_at_idx" ON "events"("deleted_at", "starts_at");
CREATE INDEX "events_visible_calendar_idx"
  ON "events"("starts_at", "ends_at", "audience", "grade_id")
  WHERE "deleted_at" IS NULL;
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");
CREATE INDEX "audit_logs_entity_entity_id_created_at_idx" ON "audit_logs"("entity", "entity_id", "created_at");
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");
CREATE INDEX "password_reset_tokens_user_id_expires_at_idx" ON "password_reset_tokens"("user_id", "expires_at");
CREATE INDEX "password_reset_tokens_active_idx" ON "password_reset_tokens"("user_id", "expires_at") WHERE "used_at" IS NULL;
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_user_id_revoked_at_expires_at_idx" ON "sessions"("user_id", "revoked_at", "expires_at");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "school_classes" ADD CONSTRAINT "school_classes_grade_id_fkey"
  FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacher_id_fkey"
  FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_grade_id_fkey"
  FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_class_id_fkey"
  FOREIGN KEY ("class_id") REFERENCES "school_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_class_id_fkey"
  FOREIGN KEY ("class_id") REFERENCES "school_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "parent_students" ADD CONSTRAINT "parent_students_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "parent_students" ADD CONSTRAINT "parent_students_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_grade_id_fkey"
  FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_class_id_fkey"
  FOREIGN KEY ("class_id") REFERENCES "school_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_deleted_by_id_fkey"
  FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "post_files" ADD CONSTRAINT "post_files_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_grade_id_fkey"
  FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_deleted_by_id_fkey"
  FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Database-level invariants. Application authorization remains mandatory; these
-- triggers prevent accidental scope/role corruption through direct database writes.
CREATE OR REPLACE FUNCTION "set_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "prevent_user_role_change"()
RETURNS TRIGGER AS $$
BEGIN
  -- Roles are set at account creation. Changing a role can silently invalidate
  -- existing class, family, authoring, and event authorization relationships.
  IF NEW."role" IS DISTINCT FROM OLD."role" THEN
    RAISE EXCEPTION 'user roles are immutable; create a replacement account and deactivate the old account';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "enforce_teacher_assignment_scope"()
RETURNS TRIGGER AS $$
DECLARE
  account_role "Role";
  class_grade UUID;
BEGIN
  SELECT "role" INTO account_role FROM "users" WHERE "id" = NEW."teacher_id";
  IF account_role IS DISTINCT FROM 'TEACHER' THEN
    RAISE EXCEPTION 'teacher_assignments.teacher_id must reference a TEACHER';
  END IF;

  IF NEW."class_id" IS NOT NULL THEN
    SELECT "grade_id" INTO class_grade FROM "school_classes" WHERE "id" = NEW."class_id";
    IF class_grade IS DISTINCT FROM NEW."grade_id" THEN
      RAISE EXCEPTION 'teacher assignment class must belong to its grade';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "enforce_student_profile_role"()
RETURNS TRIGGER AS $$
DECLARE
  account_role "Role";
BEGIN
  SELECT "role" INTO account_role FROM "users" WHERE "id" = NEW."user_id";
  IF account_role IS DISTINCT FROM 'STUDENT' THEN
    RAISE EXCEPTION 'student_profiles.user_id must reference a STUDENT';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "enforce_parent_student_roles"()
RETURNS TRIGGER AS $$
DECLARE
  parent_role "Role";
  student_role "Role";
BEGIN
  SELECT "role" INTO parent_role FROM "users" WHERE "id" = NEW."parent_id";
  SELECT "role" INTO student_role FROM "users" WHERE "id" = NEW."student_id";
  IF parent_role IS DISTINCT FROM 'PARENT' THEN
    RAISE EXCEPTION 'parent_students.parent_id must reference a PARENT';
  END IF;
  IF student_role IS DISTINCT FROM 'STUDENT' THEN
    RAISE EXCEPTION 'parent_students.student_id must reference a STUDENT';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "enforce_post_scope"()
RETURNS TRIGGER AS $$
DECLARE
  author_role "Role";
  class_grade UUID;
BEGIN
  SELECT "role" INTO author_role FROM "users" WHERE "id" = NEW."author_id";
  IF author_role NOT IN ('DIRECTOR', 'TEACHER') THEN
    RAISE EXCEPTION 'posts.author_id must reference a DIRECTOR or TEACHER';
  END IF;

  IF NEW."class_id" IS NOT NULL THEN
    SELECT "grade_id" INTO class_grade FROM "school_classes" WHERE "id" = NEW."class_id";
    IF class_grade IS DISTINCT FROM NEW."grade_id" THEN
      RAISE EXCEPTION 'post class must belong to post grade';
    END IF;
  END IF;

  IF author_role = 'TEACHER' AND NOT EXISTS (
    SELECT 1
    FROM "teacher_assignments" AS assignment
    WHERE assignment."teacher_id" = NEW."author_id"
      AND assignment."grade_id" = NEW."grade_id"
      AND assignment."subject_id" = NEW."subject_id"
      AND (assignment."class_id" IS NULL OR assignment."class_id" = NEW."class_id")
  ) THEN
    RAISE EXCEPTION 'teacher is not assigned to this post scope';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "enforce_event_author"()
RETURNS TRIGGER AS $$
DECLARE
  author_role "Role";
BEGIN
  SELECT "role" INTO author_role FROM "users" WHERE "id" = NEW."author_id";
  IF author_role IS DISTINCT FROM 'DIRECTOR' THEN
    RAISE EXCEPTION 'events.author_id must reference a DIRECTOR';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "users_prevent_role_change" BEFORE UPDATE OF "role" ON "users"
FOR EACH ROW EXECUTE FUNCTION "prevent_user_role_change"();
CREATE TRIGGER "users_set_updated_at" BEFORE UPDATE ON "users"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "grades_set_updated_at" BEFORE UPDATE ON "grades"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "school_classes_set_updated_at" BEFORE UPDATE ON "school_classes"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "subjects_set_updated_at" BEFORE UPDATE ON "subjects"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "teacher_assignments_set_updated_at" BEFORE UPDATE ON "teacher_assignments"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "student_profiles_set_updated_at" BEFORE UPDATE ON "student_profiles"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "posts_set_updated_at" BEFORE UPDATE ON "posts"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "events_set_updated_at" BEFORE UPDATE ON "events"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();

CREATE TRIGGER "teacher_assignments_enforce_scope"
BEFORE INSERT OR UPDATE OF "teacher_id", "grade_id", "class_id" ON "teacher_assignments"
FOR EACH ROW EXECUTE FUNCTION "enforce_teacher_assignment_scope"();
CREATE TRIGGER "student_profiles_enforce_role"
BEFORE INSERT OR UPDATE OF "user_id" ON "student_profiles"
FOR EACH ROW EXECUTE FUNCTION "enforce_student_profile_role"();
CREATE TRIGGER "parent_students_enforce_roles"
BEFORE INSERT OR UPDATE OF "parent_id", "student_id" ON "parent_students"
FOR EACH ROW EXECUTE FUNCTION "enforce_parent_student_roles"();
CREATE TRIGGER "posts_enforce_scope"
BEFORE INSERT OR UPDATE OF "author_id", "subject_id", "grade_id", "class_id" ON "posts"
FOR EACH ROW EXECUTE FUNCTION "enforce_post_scope"();
CREATE TRIGGER "events_enforce_author"
BEFORE INSERT OR UPDATE OF "author_id" ON "events"
FOR EACH ROW EXECUTE FUNCTION "enforce_event_author"();
