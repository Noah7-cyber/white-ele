-- Schema additions for admin attendance + kiosk PIN.
--
-- Run this against environments where TypeORM `synchronize` is OFF
-- (i.e. DB_SYNC is not "true"). When DB_SYNC=true, the entities are
-- synced automatically and you do NOT need to run this file.
--
-- Postgres-only.

BEGIN;

-- 1) admin table: kiosk PIN (default "1234"), current/previous attendance pointers.
ALTER TABLE public.admin
    ADD COLUMN IF NOT EXISTS "pin" VARCHAR(100) DEFAULT '1234';

ALTER TABLE public.admin
    ADD COLUMN IF NOT EXISTS "currentAttendanceId" INTEGER;

ALTER TABLE public.admin
    ADD COLUMN IF NOT EXISTS "previousAttendanceId" INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_admin_current_attendance'
    ) THEN
        ALTER TABLE public.admin
            ADD CONSTRAINT fk_admin_current_attendance
            FOREIGN KEY ("currentAttendanceId") REFERENCES public.attendances(id)
            ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_admin_previous_attendance'
    ) THEN
        ALTER TABLE public.admin
            ADD CONSTRAINT fk_admin_previous_attendance
            FOREIGN KEY ("previousAttendanceId") REFERENCES public.attendances(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- 2) attendances table: link to admin who is being clocked in/out.
ALTER TABLE public.attendances
    ADD COLUMN IF NOT EXISTS "adminId" INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_attendance_admin'
    ) THEN
        ALTER TABLE public.attendances
            ADD CONSTRAINT fk_attendance_admin
            FOREIGN KEY ("adminId") REFERENCES public.admin(id)
            ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_attendances_adminId ON public.attendances ("adminId");

-- 3) Backfill default PIN on existing admin rows that have none.
UPDATE public.admin SET "pin" = '1234' WHERE "pin" IS NULL OR "pin" = '';

COMMIT;
