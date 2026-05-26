/* eslint-disable @typescript-eslint/no-explicit-any */
import { classroomServices } from "@/services/classroom.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";

interface ClassroomRow {
    classroomName: string;
    enrolledStudentsCount: number;
    staffCount: number;
    ratio: string | null;
    [key: string]: any;
}

export function useAttendanceClassrooms(startDate?: string, endDate?: string) {
    const { filters, applyFilters } = useFilter({
        delta: ITEMS_PER_PAGE,
        pos: 0
    });

    const { data: response = {} as any, isLoading } = useQueryService({
        service: {
            ...classroomServices.getAllClassrooms,
            data: {
                delta: filters?.delta,
                pos: filters?.pos,
                // The API might not support date filtering for classroom list directly, 
                // but we include them if the endpoint handles them for reporting.
                ...(startDate && endDate ? { startDate, endDate } : {}),
            }
        },
        options: {
            keys: ['attendance-classrooms', startDate, endDate, filters.pos, filters.delta]
        }
    });

    // Handle both response structures
    const classrooms = response?.classrooms || [];
    const pagination = response?.pagination || {};
    const totalCount = pagination?.count || pagination?.total || 0;

    const getGCD = (a: number, b: number): number => {
        return b === 0 ? a : getGCD(b, a % b);
    };

    const formatRatio = (num1: number, num2: number): string => {
        if (num1 === 0 || num2 === 0) return `${num1}:${num2}`;
        const common = getGCD(num1, num2);
        return `${num1 / common}:${num2 / common}`;
    };

    const tableData = classrooms.map((c: ClassroomRow) => {
        const studentCount = c?.studentsCurrentClass?.length ?? 0;
        const staffCount = c?.assignedStaff?.length ?? 0;
        return {
            name: c?.classroomName ?? "-",
            students: studentCount,
            staff: staffCount,
            ratio: formatRatio(studentCount, staffCount),
        };
    });

    const currentPage = Math.floor((pagination?.pos || filters?.pos || 0) / (pagination?.delta || filters?.delta || ITEMS_PER_PAGE)) + 1;

    return {
        isLoading,
        tableData,
        currentPage,
        totalCount,
        filters,
        applyFilters,
    };
}
