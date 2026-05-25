-- Make academicYear optional for existing databases
ALTER TABLE "curriculums"
  ALTER COLUMN "academicYear" DROP NOT NULL;
