/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { tourServices } from "@/services/tour.service";
import { useFilter } from "@/utils/hooks/useFilter";

const useTour = ({ delta = 5 }: { delta?: number } = {}) => {
  const {
    data: toursData,
    isPending: isToursLoading,
    refetch: fetchAllTours,
    hasNextPage: hasMoreTours,
    fetchNextPage: fetchNextTourPage,
    isFetchingNextPage: isFetchingNextTours,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...tourServices.getAllTours,
      data: { delta },
    },
  });

  const [currentPage, setCurrentPage] = useState(1);
  const { filters, applyFilters } = useFilter({
    search: "",
    delta,
  });

  const {
    data: admissionsData,
    isPending: isAdmissionsLoading,
    refetch: fetchAllAdmissions,
    hasNextPage: hasMoreAdmissions,
    fetchNextPage: fetchNextAdmissionPage,
    isFetchingNextPage: isFetchingNextAdmissions,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...tourServices.getAdmissions,
      data: {
        ...(filters?.delta ? { delta: filters?.delta } : {}),
        search: filters.search,
        orderBy: "createdAt",
      },
    },
  });

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    applyFilters({
      ...filters,
      search: e.target.value,
    });
    setCurrentPage(1);
  };

  const fetchedTours = useMemo(() => {
    return (
      toursData?.pages?.reduce<any[]>((acc, page) => {
        return acc.concat(page?.tourEvents ?? page?.data ?? []);
      }, []) ?? []
    );
  }, [toursData?.pages]);

  const fetchedAdmissions = useMemo(() => {
    return (
      admissionsData?.pages?.reduce<any[]>((acc, page) => {
        return acc.concat(page?.admissions ?? page?.data ?? []);
      }, []) ?? []
    );
  }, [admissionsData?.pages]);

  const handlePageChange = ({ page }: { page: number; rowsPerPage: number }) => {
    // rowsPerPage is currently fixed in the UI, so page change should only switch pages.
    // Data fetching for missing pages is handled in an effect below.
    setCurrentPage(page);
  };

  useEffect(() => {
    const requiredItems = currentPage * delta;
    const loadedItems = fetchedAdmissions.length;

    if (loadedItems < requiredItems && hasMoreAdmissions && !isFetchingNextAdmissions) {
      fetchNextAdmissionPage();
    }
  }, [
    currentPage,
    delta,
    fetchedAdmissions.length,
    hasMoreAdmissions,
    isFetchingNextAdmissions,
    fetchNextAdmissionPage,
  ]);

  const toursTotalCount = useMemo(() => {
    const lastPage = toursData?.pages?.[toursData.pages.length - 1];
    return lastPage?.pagination?.count ?? 0;
  }, [toursData?.pages]);

  const admissionsTotalCount = useMemo(() => {
    const lastPage = admissionsData?.pages?.[admissionsData.pages.length - 1];
    return lastPage?.pagination?.count ?? 0;
  }, [admissionsData?.pages]);

  return {
    fetchedTours,
    isToursLoading,
    fetchAllTours,
    hasMoreTours,
    fetchNextTourPage,
    isFetchingNextTours,
    toursTotalCount,
    currentPage,
    handlePageChange,
    fetchedAdmissions,
    isAdmissionsLoading,
    fetchAllAdmissions,
    hasMoreAdmissions,
    fetchNextAdmissionPage,
    isFetchingNextAdmissions,
    admissionsTotalCount,
    handleSearch,
  };
};

export default useTour;
