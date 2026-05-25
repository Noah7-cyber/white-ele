-- Insert staff attendance records for the last 5 weekdays
-- Date range: Dec 30, 2025 to Jan 5, 2026 (weekdays only)

INSERT INTO public.attendances (
    date,
    status,
    "studentId",
    "teacherId",
    "classroomId",
    "schoolId",
    "recordedBy",
    "createdAt",
    "updatedAt"
)
SELECT 
    dates.date,
    CASE 
        WHEN RANDOM() < 0.85 THEN 'present'::attendances_status_enum
        WHEN RANDOM() < 0.95 THEN 'late'::attendances_status_enum
        ELSE 'absent'::attendances_status_enum
    END as status,
    NULL as "studentId",
    t.id as "teacherId",
    NULL as "classroomId",
    t."schoolId",
    79 as "recordedBy",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM 
    public.teachers t
CROSS JOIN (
    SELECT '2025-12-30'::date as date
    UNION ALL SELECT '2025-12-31'::date
    UNION ALL SELECT '2026-01-01'::date
    UNION ALL SELECT '2026-01-02'::date
    UNION ALL SELECT '2026-01-05'::date
) as dates
WHERE 
    t.id BETWEEN 26 AND 225
    AND t.status = 'active'
ORDER BY 
    t.id, dates.date;

-- Verify the inserts
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT "teacherId") as unique_teachers,
    COUNT(DISTINCT date) as unique_dates,
    status,
    COUNT(*) as status_count
FROM 
    public.attendances
WHERE 
    "teacherId" BETWEEN 26 AND 225
    AND date >= '2025-12-30'
GROUP BY 
    status;

