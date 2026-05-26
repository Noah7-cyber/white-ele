/* eslint-disable @typescript-eslint/no-explicit-any */
import { tourServices, scheduleTourServices } from "@/services/tour.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";

/** @internal reserved for table row typing */
export interface TourRow {
    title: string;
    count?: number;
    [key: string]: any;
}

export function useTours(classroomId?: number | null, startDate?: string, endDate?: string) {
    const { filters, applyFilters } = useFilter({
        delta: ITEMS_PER_PAGE,
        pos: 0
    });

    // Fetch booked tours for counting per event
    const { data: response = {} as any, isLoading } = useQueryService({
        service: {
            ...scheduleTourServices.getBookedTours,
            data: {
                ...(filters?.delta ? { delta: filters?.delta } : {}),
                ...(filters?.pos ? { pos: filters?.pos } : {}),
                ...(classroomId ? { classroomId } : {}),
                ...(startDate ? { startDate } : {}),
                ...(endDate ? { endDate } : {}),
            }
        },
        options: {
            keys: ['booked-tours', filters.pos, filters.delta]
        }
    });

    const bookings = response?.bookings || [];


    // Fetch tour definitions with pagination
    const { data: toursResponse = {} as any } = useQueryService({
        service: {
            ...tourServices.getAllTours,
            data: {
                ...(filters?.delta ? { delta: filters?.delta } : {}),
                ...(filters?.pos ? { pos: filters?.pos } : {}),
            }
        },
        options: {
            keys: ['tour-events', filters.pos, filters.delta]
        }
    });

    const tourEvents = toursResponse?.tourEvents || toursResponse?.data || [];

    // Group and count booked tours per tour event
    const tableData = tourEvents.map((event: any) => {
        const bookingCount = bookings.filter((b: any) => b.tourEvent?.id === event.id).length;
        return {
            title: event.title ?? "-",
            count: bookingCount,
        };
    });
    const pagination = toursResponse?.pagination || {};
    const totalItems = toursResponse?.pagination?.count || tourEvents.length;
    const currentPage = Math.floor((pagination?.pos || filters?.pos || 0) / (pagination?.delta || filters?.delta || ITEMS_PER_PAGE)) + 1;

    return {
        isLoading,
        tableData,
        currentPage,
        totalItems,
        filters,
        applyFilters,
    };
}
