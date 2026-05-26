/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";
import { analyticsServices } from "@/services/analytics.service";

interface SummaryRow {
    studentName: string;
    totalPresentHours: number;
    totalAbsentHours: number;
    [key: string]: any;
}

export function useForms(classroomId?: number | null, startDate?: string, endDate?: string) {
    const { filters, applyFilters } = useFilter({
        delta: ITEMS_PER_PAGE,
        pos: 0
    });

    // Re-using student summary endpoint if appropriate, or check if there's a specific report endpoint
    const { data: response = {} as any, isLoading } = useQueryService({
        service: {
            ...analyticsServices.getFormPerformance,
            data: {
                ...(filters?.delta ? { delta: filters?.delta } : {}),
                ...(filters?.pos ? { pos: filters?.pos } : {}),
                ...(classroomId ? { classroomId } : {}),
                ...(startDate && endDate ? { startDate, endDate } : {}),
            }
        },
        options: {
            keys: ['admission-forms', classroomId, startDate, endDate, filters.pos, filters.delta]
        }
    });

    // Handle both response structures: { data: [], pagination: {} } or just { data: [] }
    const summaryData = response?.data || [];
    const pagination = response?.pagination || {
        pos: filters?.pos || 0,
        delta: filters?.delta || ITEMS_PER_PAGE,
        count: summaryData.length
    };

    const tableData = summaryData.map((item: SummaryRow) => ({
        name: item.formName || "N/A",
        totalSubmissions: item.totalSubmissions || 0,
        totalAccepted: item.totalAccepted || 0,
    }));

    const currentPage = Math.floor((pagination?.pos || 0) / (pagination?.delta || ITEMS_PER_PAGE)) + 1;

    return {
        isLoading,
        tableData,
        currentPage,
        pagination,
        filters,
        applyFilters,
    };
}
