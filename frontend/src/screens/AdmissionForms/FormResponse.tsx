/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { ButtonIcon, ButtonVariant } from "@/modules/shared/component/ButtonIcon";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { useGetFormBySlug } from "@/screens/AdmissionForms/hooks/useFormApi";
import { formDynamicEndpoints } from "@/services/form.service";
import { Button } from "@/modules/shared/component/Button";
import EmptyStateIcon from "@/modules/shared/assets/svgs/items.svg";
import { CWPopover } from "@/modules/shared/component/Popover/popover";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import { useMutationService } from "@/utils/hooks/useMutationService";
import CaretDown from "@/modules/shared/assets/svgs/caretDown.svg";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import WarnIcon from "@/modules/shared/assets/svgs/warnIcon.svg";

// Helpers
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = (hours % 12 || 12).toString().padStart(2, "0");
  return `${day} ${month}, ${year}  ${formattedHours}:${minutes} ${ampm}`;
}

export function resolveAnswer(responseItem: any, formItem: any): string {
  if (responseItem.value !== null && responseItem.value !== undefined) {
    return responseItem.value;
  }
  if (responseItem.selectedOptionId !== null && formItem.options?.length) {
    const opt = formItem.options.find((o: any) => o.id === responseItem.selectedOptionId);
    return opt?.label ?? "—";
  }
  return "—";
}

export function getResponderName(response: any, formItems: any[]): string {
  if (Array.isArray(response.names) && response.names.length > 0) {
    const joined = response.names
      .map((n: any) => String(n).trim())
      .filter(Boolean)
      .join(", ");
    if (joined) return joined;
  }
  const firstNameItem = formItems.find((item) => item.title?.trim().toLowerCase() === "first name");
  if (!firstNameItem) return "—";

  const nameResponse = response.formResponseItems.find(
    (ri: any) => ri.formItemId === firstNameItem.id,
  );
  if (!nameResponse) return "—";
  const name = resolveAnswer(nameResponse, firstNameItem);
  return name && name !== "—" ? name : "—";
}

export function getResponderEmail(response: any): string {
  const email = response.email?.trim();
  return email || "—";
}

function isToday(date: Date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function ActionPopover({
  response,
  slug,
  onMarkReviewed,
  onDelete,
}: {
  response: any;
  slug: string;
  onMarkReviewed: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const router = useRouter();

  return (
    <CWPopover
      buttonProps={{ className: "!p-0 !min-w-0" }}
      actionComponent={
        <ButtonIcon variant={ButtonVariant.outlined} className="rotate-90! bg-white! rounded-sm!">
          <EllipsesIcon />
        </ButtonIcon>
      }
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      popoverProps={{ transformOrigin: { vertical: "top", horizontal: "right" } }}
    >
      {(closePopover) => (
        <Box className="flex flex-col py-1 gap-1 min-w-37.5">
          <button
            className="px-4 py-2 text-left text-xs hover:bg-gray-100 cursor-pointer text-gray-700"
            onClick={() => {
              closePopover();
              router.push(`/admin/admission/forms/${slug}/responses/${response.id}`);
            }}
          >
            View Details
          </button>
          <button
            className="px-4 py-2 text-left text-xs hover:bg-gray-100 cursor-pointer text-gray-700"
            onClick={() => {
              closePopover();
              onMarkReviewed(response.id);
            }}
          >
            Mark Reviewed
          </button>
          <button
            className="px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 cursor-pointer"
            onClick={() => {
              closePopover();
              onDelete(response.id);
            }}
          >
            Delete
          </button>
        </Box>
      )}
    </CWPopover>
  );
}

function getResponseStatus(response: any) {
  return response.status === "submitted" || !response.status ? "Pending" : "Reviewed";
}

function getResponseStatusBadge(response: any) {
  const isPending = getResponseStatus(response) === "Pending";

  return (
    <span
      className={`flex items-center justify-center gap-2 px-2 py-1 rounded-full text-xs! font-normal! capitalize min-w-[80px] ${
        isPending ? "bg-[#FFF6DD] text-[#A88400]" : "bg-green-100 text-green-700"
      }`}
    >
      {isPending ? "Pending" : "Reviewed"}
    </span>
  );
}

const ROWS_PER_PAGE = 10;

const FormResponse = () => {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string | undefined;

  const [activeTab, setActiveTab] = useState("Table View");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [reviewTarget, setReviewTarget] = useState<number | null>(null);

  const { data: formsData, isLoading, isError, refetch } = useGetFormBySlug(slug ?? null);
  const form = formsData?.form;

  // Ideally, use specialized endpoints from useFormApi, using raw mutations for now if not available
  const { mutateAsync: patchResponseStatus, isPending: isPatchingResponse } = useMutationService({
    service: (variables: any) => formDynamicEndpoints.patchFormResponseStatus(variables.id),
    options: {
      successTitle: "Status Updated",
      onSuccess: () => refetch(),
    },
  });

  const formResponses: any[] = useMemo(() => form?.formResponses ?? [], [form?.formResponses]);
  const formItems: any[] = useMemo(() => form?.formItems ?? [], [form?.formItems]);

  const handleMarkReviewed = async (id: number) => {
    setReviewTarget(id);
  };

  const handleConfirmReview = async () => {
    if (!reviewTarget) return;
    try {
      await patchResponseStatus({ id: reviewTarget, status: "accepted" });
    } catch (error) {
      console.error(error);
    } finally {
      setReviewTarget(null);
    }
  };

  const handleDeleteResponse = async (id: number) => {
    // Requires an actual endpoint or can mock if endpoint doesn't exist
    console.log("Delete request for ID:", id);
    alert(`Delete response endpoint not fully wired for ID: ${id}. Implement when ready.`);
  };

  const totalResponses = formResponses.length;
  const todayResponses = formResponses.filter((r) => isToday(new Date(r.submittedAt))).length;
  // pending can be 'submitted' or empty mapped to Pending
  const pendingReview = formResponses.filter((r) => r.status === "submitted" || !r.status).length;
  const reviewed = formResponses.filter(
    (r) => r.status === "reviewed" || r.status === "completed",
  ).length;

  const filteredResponses = useMemo(() => {
    return formResponses
      .filter((r) => {
        const matchStatus =
          statusFilter === "All Status" ||
          (statusFilter === "Pending" && (r.status === "submitted" || !r.status)) ||
          (statusFilter === "Reviewed" && (r.status === "reviewed" || r.status === "completed"));

        const q = searchQuery.toLowerCase();
        const matchSearch =
          q === "" ||
          getResponderName(r, formItems).toLowerCase().includes(q) ||
          getResponderEmail(r).toLowerCase().includes(q);

        return matchStatus && matchSearch;
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [formResponses, formItems, searchQuery, statusFilter]);

  const paginatedResponses = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredResponses.slice(start, start + ROWS_PER_PAGE);
  }, [filteredResponses, currentPage]);

  const rows = paginatedResponses.map((response) => {
    return {
      0: (
        <div>
          <p className="text-sm text-gray-900 font-medium">
            {getResponderName(response, formItems)}
          </p>
          <p className="text-xs text-gray-500">{getResponderEmail(response)}</p>
        </div>
      ),
      1: <span className="text-xs text-gray-700">{formatDate(response.submittedAt)}</span>,
      2: <Box className="flex justify-center items-center">{getResponseStatusBadge(response)}</Box>,
      3: (
        <ActionPopover
          response={response}
          slug={slug!}
          onMarkReviewed={handleMarkReviewed}
          onDelete={handleDeleteResponse}
        />
      ),
    };
  });

  return (
    <Box className="min-h-screen p-4 md:p-5 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <ButtonIcon
            onClick={() => router.back()}
            className="rounded-full border! border-brandColor-active/20! flex items-center justify-center shrink-0"
          >
            <Image src={LeftIcon} alt="back icon" />
          </ButtonIcon>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900 break-words">
              {isLoading ? "Loading…" : form?.title}
            </h1>
            {!isLoading && form && (
              <p className="text-sm text-gray-500 mt-0.5 break-words">
                {formResponses.length} response{formResponses.length !== 1 ? "s" : ""} • Last
                updated:{" "}
                {formatDate(
                  formResponses[0]?.submittedAt || form.updatedAt || new Date().toISOString(),
                )}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outlined"
          className="!rounded-lg !hidden md:!flex !bg-transparent !text-gray-700 !border-gray-300"
          startIcon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10"
                stroke="#344054"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.66602 6.66699L7.99935 10.0003L11.3327 6.66699"
                stroke="#344054"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 10V2"
                stroke="#344054"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        >
          Export
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { title: "Total Responses", value: totalResponses },
          { title: "Today's Responses", value: todayResponses },
          { title: "Pending Review", value: pendingReview },
          { title: "Reviewed", value: reviewed },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white px-4 py-3 rounded-md border border-brandColor-active/20 min-h-20 lg:min-h-30 flex flex-col justify-between"
          >
            <h3 className="text-text-primary text-sm! font-semibold!">{card.title}</h3>
            <p className="text-xl! font-bold!">{isLoading ? "-" : card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs & Controls */}
      <div className="w-full mt-4 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-lighten!">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar min-w-0">
          {["Table View", "Summary View"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 whitespace-nowrap text-sm font-normal pb-3 px-3 cursor-pointer border-b-2 -mb-[1px] ${
                activeTab === tab
                  ? "font-medium border-brandColor-active text-brandColor-active"
                  : "border-transparent text-[#475467]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Controls Placeholder or actual controls */}
        {activeTab === "Table View" ? (
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-end shrink-0 min-h-[44px] w-full md:w-auto">
            <div className="w-full md:w-72">
              <SearchTextfield
                placeholder="Search by name, email, etc.."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                fullWidth
              />
            </div>
            <CWPopover
              actionComponent={
                <>
                  {statusFilter} <CaretDown className="ml-2" />
                </>
              }
              buttonProps={{
                isRounded: false,
                variant: "outlined",
                className:
                  "!rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm !text-nowrap !min-w-fit !justify-between w-full md:w-auto",
              }}
            >
              <Box paddingY={1}>
                <Box className="flex flex-col gap-y-2 p-3! !min-w-fit">
                  {["All Status", "Pending", "Reviewed"].map((status) => (
                    <button
                      key={status}
                      className="text-sm! p-1 flex flex-row gap-2 items-center cursor-pointer"
                      onClick={() => {
                        setStatusFilter(status);
                        setCurrentPage(1);
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </Box>
              </Box>
            </CWPopover>
          </div>
        ) : (
          <div className="pb-3 min-h-[44px] hidden md:block"></div>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <Box className="flex flex-col items-center justify-center gap-1.5 py-20">
          <EmptyStateIcon />
          <Typography className="text-xl! mt-2! text-[#003049]! font-medium!">
            Something went wrong.
          </Typography>
          <Typography className="text-sm! text-textColor/50! font-normal!">
            Failed to load form responses. Please try again.
          </Typography>
        </Box>
      )}

      {/* Content */}
      {!isError && activeTab === "Table View" && (
        <Box className="space-y-4">
          <div className="md:hidden flex flex-col gap-3">
            {isLoading
              ? Array.from({ length: ROWS_PER_PAGE }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#E4E7EC] bg-white p-4 h-28 animate-pulse"
                  />
                ))
              : paginatedResponses.map((response) => (
                  <div
                    key={response.id}
                    className="rounded-xl border border-[#E4E7EC] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {getResponderName(response, formItems)}
                        </p>
                        <p className="truncate text-xs text-text-secondary">
                          {getResponderEmail(response)}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <ActionPopover
                          response={response}
                          slug={slug!}
                          onMarkReviewed={handleMarkReviewed}
                          onDelete={handleDeleteResponse}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary break-words">
                          {formatDate(response.submittedAt)}
                        </p>
                      </div>
                      <div className="shrink-0">{getResponseStatusBadge(response)}</div>
                    </div>
                  </div>
                ))}

            {!isLoading && filteredResponses.length === 0 && (
              <Box className="flex flex-col items-center justify-center gap-1.5 py-10 bg-white rounded-xl border border-[#E4E7EC]">
                <EmptyStateIcon />
                <Typography className="text-lg! mt-2! text-[#003049]! font-medium!">
                  No responses found.
                </Typography>
              </Box>
            )}
          </div>

          <div className="hidden md:block bg-white border text-sm font-semibold border-gray-100 rounded-xl overflow-hidden">
            <Table
              headers={["Respondent Name", "Date Submitted", "Status", "Action"]}
              tableData={rows}
              isCollapse
              isLoading={isLoading}
              centeredHeaderIndex={[1, 2]}
              rightAlignedIndex={[3]}
              onRowClick={() => {}}
              bodyRowClassName="!text-center"
              emptyState={
                <Box className="flex flex-col items-center justify-center gap-1.5 py-10">
                  <EmptyStateIcon />
                  <Typography className="text-lg! mt-2! text-[#003049]! font-medium!">
                    No responses found.
                  </Typography>
                </Box>
              }
            />
          </div>

          {!!filteredResponses.length && (
            <Box className="flex justify-center pt-4">
              <PaginationControls
                currentPage={currentPage}
                rowsPerPage={ROWS_PER_PAGE}
                totalItems={filteredResponses.length}
                onPageChange={({ page }: { page: number }) => setCurrentPage(page)}
                isCondense
                bottomTableClasses="!text-xs"
              />
            </Box>
          )}
        </Box>
      )}

      {!isError && activeTab === "Summary View" && (
        <Box className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6 space-y-2">
            <h3 className="text-base font-bold text-[#003049]">Response Summary</h3>
            <p className="text-sm text-gray-500">{form?.description}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col p-4 md:p-6 space-y-8">
            {formItems.map((item, index) => {
              // Render stats based on type
              const responsesWithValues = formResponses.filter((r) =>
                r.formResponseItems.some(
                  (fri: any) => fri.formItemId === item.id && resolveAnswer(fri, item) !== "—",
                ),
              );

              return (
                <div
                  key={item.id}
                  className={index !== formItems.length - 1 ? "border-b border-gray-100 pb-8" : ""}
                >
                  <h4 className="font-semibold text-[#003049] text-sm mb-3">{item.title}</h4>

                  {["short_answer", "long_answer", "email"].includes(item.type) ? (
                    <p className="text-sm text-gray-400">
                      {responsesWithValues.length} text responses
                    </p>
                  ) : item.options && item.options.length > 0 ? (
                    <div className="space-y-4 mt-4">
                      {item.options.map((opt: any) => {
                        const count = formResponses.filter((r) =>
                          r.formResponseItems.some(
                            (fri: any) =>
                              fri.formItemId === item.id && fri.selectedOptionId === opt.id,
                          ),
                        ).length;
                        const percentage =
                          totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
                        return (
                          <div key={opt.id} className="flex items-center gap-3 md:gap-4">
                            <span
                              className="w-20 md:w-24 text-xs text-gray-500 truncate"
                              title={opt.label}
                            >
                              {opt.label}:
                            </span>
                            <div className="flex-1 bg-gray-100 h-3 rounded-full overflow-hidden">
                              <div
                                className="bg-[#008080] h-full rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="w-8 text-xs text-gray-400 text-right">
                              {percentage}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">{responsesWithValues.length} responses</p>
                  )}
                </div>
              );
            })}
          </div>
        </Box>
      )}

      <ConfirmModal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onConfirm={handleConfirmReview}
        loading={isPatchingResponse}
        title="Mark as Accepted"
        description="Are you sure you want to mark this response as accepted? This will update the status and notify the relevant stakeholders."
        confirmLabel="Accept"
        icon={<WarnIcon />}
      />
    </Box>
  );
};

export default FormResponse;
