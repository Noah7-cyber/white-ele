"use client";

import { Box, Typography, TextField, Skeleton } from "@mui/material";
import React, { useMemo } from "react";
import { OpenInNew } from "@mui/icons-material";
import useTour from "@/modules/admin/component/ToursPage/hooks/useTour";
import CopyIcon from "@/modules/shared/assets/svgs/copy.svg";
import { showToast } from "@/modules/shared/component/Toast";
import { getSchoolFromCookie, getSchoolPortalBaseDomain } from "@/utils/helper";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { Tours } from "@/services/tour.service";
import { GetSchoolResponse, schoolDynamicEndpoints } from "@/services/school.service";

const DashboardPublicLinkSetting = () => {
  const { fetchedTours, isToursLoading, fetchedAdmissions, isAdmissionsLoading } = useTour();

  const { data: schoolData } = useQueryService<object, GetSchoolResponse>({
    service: schoolDynamicEndpoints.getParticularSchool(),
    options: {
      keys: ["getSchool"],
    },
  });

  const subDomain = (
    schoolData?.school?.subDomain ||
    getSchoolFromCookie()?.subDomain ||
    ""
  ).trim();
  const URL_PREFIX = `https://${subDomain}.${getSchoolPortalBaseDomain()}`;
  const tourUrlPrefix = `${URL_PREFIX}/tour-events/`;
  const formsUrlPrefix = `${URL_PREFIX}/forms/live/`;

  const tourItems = useMemo(() => {
    return (fetchedTours ?? []).filter((item: Tours) => {
      const itemType = item.type?.toLowerCase();
      if (itemType === "tour") return true;
      // Some tour-event payloads may not include type; keep records that look like tours.
      return Boolean(item.url && !item.slug);
    });
  }, [fetchedTours]);

  const admissionForms = useMemo(() => {
    const list = fetchedAdmissions;

    if (!Array.isArray(list)) return [];

    return list
      .filter((item: Tours) => item.type?.toLowerCase() !== "tour")
      .map((item: Tours) => ({
        id: item.id,
        name: item.name || item.title || "Admission Form",
        slug: item.slug,
      }))
      .filter((item: { slug?: string }) => Boolean(item.slug));
  }, [fetchedAdmissions]);

  const handlePreview = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      showToast({
        message: "Link copied to clipboard",
        severity: "success",
      });
    });
  };

  return (
    <Box className="rounded-lg bg-white flex flex-col gap-5 p-4 sm:p-5">
      <Box className="border border-solid border-[#D98808] bg-[#FF9C0012] py-4 px-3 rounded-xl flex flex-col gap-3 sm:px-4">
        <Typography className="text-[#D98808] font-medium! text-sm!">
          Configuration Guide
        </Typography>
        <Typography className="text-[#D98808] md:text-sm! text-xs! font-light!">
          These URLs are used in automated emails sent to parents and can be embedded on your public
          website.
        </Typography>
      </Box>

      {/* Tour Booking Page URLs */}
      {isToursLoading ? (
        <Box className="flex flex-col gap-2">
          <Skeleton variant="text" width={150} height={24} />
          <Box className="flex flex-row gap-2 items-center">
            <Skeleton variant="rectangular" width="100%" height={40} className="grow" />
            <Skeleton variant="rectangular" width={100} height={40} />
          </Box>
        </Box>
      ) : (
        <Box className="flex flex-col gap-2">
          <Typography className="text-lg! font-semibold! text-[#022F2F]! sm:!text-xl">
            Tour Booking Page
          </Typography>
          {tourItems.length === 0 ? (
            <TextField
              fullWidth
              value="No tour booking links available"
              variant="outlined"
              InputProps={{
                readOnly: true,
                className: "!text-xs !h-10 !bg-gray-50",
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#D0D5DD",
                  },
                  "&:hover fieldset": {
                    borderColor: "#D0D5DD",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#D0D5DD",
                  },
                },
              }}
            />
          ) : (
            tourItems.map((tour) => {
              const fullTourUrl = `${tourUrlPrefix}${tour.url}`;
              return (
                <Box key={tour.id} className="flex flex-col gap-2">
                  <Typography className="text-sm! font-medium! text-[#022F2F]!">
                    {tour.title}
                  </Typography>
                  <Box className="flex flex-row gap-2 items-center">
                    <TextField
                      fullWidth
                      value={fullTourUrl}
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                        className: "!text-xs !h-10 !bg-gray-50",
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: "#D0D5DD",
                          },
                          "&:hover fieldset": {
                            borderColor: "#D0D5DD",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#D0D5DD",
                          },
                        },
                      }}
                    />
                    <div className="flex shrink-0 flex-row gap-3 px-3 py-2 items-center justify-center rounded-sm! text-xs! font-medium! border border-[#D0D5DD] text-[#022F2F]!">
                      <div
                        onClick={() => handlePreview(fullTourUrl)}
                        className="text-sm! font-medium! px-0! py-0! text-[#001F1FB2]! cursor-pointer hover:bg-gray-50!"
                      >
                        <OpenInNew sx={{ fontSize: 24 }} />
                      </div>
                      <CopyIcon onClick={() => handleCopy(fullTourUrl)} className="cursor-pointer" />
                    </div>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      )}

      {/* Admission Forms URL */}
      {isAdmissionsLoading ? (
        <Box className="flex flex-col gap-2">
          <Skeleton variant="text" width={150} height={24} />
          <Box className="flex flex-row gap-2 items-center">
            <Skeleton variant="rectangular" width="100%" height={40} className="grow" />
            <Skeleton variant="rectangular" width={100} height={40} />
          </Box>
        </Box>
      ) : (
        <Box className="flex flex-col gap-2">
          <Typography className="text-lg! font-semibold! text-[#022F2F]! sm:!text-xl">
            Admission Form
          </Typography>
          {admissionForms.length === 0 ? (
            <TextField
              fullWidth
              value="No admission form links available"
              variant="outlined"
              InputProps={{
                readOnly: true,
                className: "!text-xs !h-10 !bg-gray-50",
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#D0D5DD",
                  },
                  "&:hover fieldset": {
                    borderColor: "#D0D5DD",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#D0D5DD",
                  },
                },
              }}
            />
          ) : (
            admissionForms.map((form: { id: number; name: string; slug: string }) => {
              const admissionFormsUrl = `${formsUrlPrefix}${form.slug}`;
              return (
                <Box key={form.id} className="flex flex-col gap-2">
                  <Typography className="text-sm! font-medium! text-[#022F2F]!">
                    {form.name}
                  </Typography>
                  <Box className="flex flex-row gap-2 items-center">
                    <TextField
                      fullWidth
                      value={admissionFormsUrl}
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                        className: "!text-xs !h-10 !bg-gray-50",
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: "#D0D5DD",
                          },
                          "&:hover fieldset": {
                            borderColor: "#D0D5DD",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#D0D5DD",
                          },
                        },
                      }}
                    />
                    <div className="flex shrink-0 flex-row gap-3 px-3 py-2 items-center justify-center rounded-sm! text-xs! font-medium! border border-[#D0D5DD] text-[#022F2F]!">
                      <div
                        onClick={() => handlePreview(admissionFormsUrl)}
                        className="text-sm! font-medium! px-0! py-0! text-[#001F1FB2]! cursor-pointer hover:bg-gray-50!"
                      >
                        <OpenInNew sx={{ fontSize: 24 }} />
                      </div>
                      <CopyIcon
                        onClick={() => handleCopy(admissionFormsUrl)}
                        className="cursor-pointer"
                      />
                    </div>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      )}
    </Box>
  );
};

export default DashboardPublicLinkSetting;
