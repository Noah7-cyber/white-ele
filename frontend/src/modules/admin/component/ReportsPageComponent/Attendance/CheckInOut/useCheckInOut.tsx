/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { AttendanceServices } from "@/services/attendance.service";
import { capitalizeFirstLetter, timeFormatter } from "@/utils/helpers";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";

interface BaseRow {
    id: number;
    date: string;
    status: string;
    timeIn: string;
    timeOut: string;
    notes: string | null;
    studentName: string | null;
    [key: string]: any;
}

export function useCheckInOut(classroomId?: number | null, startDate?: string, endDate?: string, status?: string) {
    const { filters, applyFilters } = useFilter({
        delta: ITEMS_PER_PAGE,
        pos: 0
    });

    const { data: { attendances = [], pagination = {} } = {} as any, isLoading, refetch } = useQueryService({
        service: {
            ...AttendanceServices.getChildrenAttendance,
            data: {
                ...(filters?.delta ? { delta: filters?.delta } : {}),
                ...(filters?.pos ? { pos: filters?.pos } : {}),
                ...(classroomId ? { classroomId } : {}),
                ...(startDate && endDate ? { startDate, endDate } : {}),
                ...(status ? { status: status } : {})
        },
        options: {
            keys: ['check-in-out', classroomId, startDate, endDate, filters.pos, filters.delta]
        }
    }});

    const statusStyles: Record<string, string> = {
        Present: "bg-[#E6FFF3] text-[#0A8A4C]",
        Absent: "bg-[#FFE6E6] text-[#C74444]",
        Late: "bg-[#FFF6DD] text-[#A88400]",
    };

    const StatusPill = ({ status }: { status: string }) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block w-20 text-center ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
            {status}
        </span>
    );

    const tableData = attendances.map((t: BaseRow) => ({
        name: t?.studentName ?? "-",
        timeIn: timeFormatter(t?.timeIn),
        timeOut: timeFormatter(t?.timeOut),
        reason: t?.notes ?? "-",
        status: <StatusPill status={capitalizeFirstLetter(t?.status ?? "-")} />,
    }));

    const currentPage = Math.floor((pagination?.pos || 0) / (pagination?.delta || ITEMS_PER_PAGE)) + 1;

    return {
        isLoading,
        tableData,
        currentPage,
        pagination,
        filters,
        applyFilters,
        refetch
    };
}
