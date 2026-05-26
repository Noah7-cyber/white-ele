"use client";

import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { Box } from "@mui/system";
import Image from "next/image";
import React from "react";

interface InfoField {
  label: string;
  value: string | number; // <-- allow number
}

interface InfoSection2Props {
  title: string;
  fields: InfoField[];
  childPhoto?: string;
  childName?: string;
}

interface InfoItem {
  label: string;
  value: string | number | React.ReactNode;
}

interface Stats {
  items: InfoItem[];
}

interface TagItem {
  label: string;
  colorClass?: string;
}

interface ContactItem {
  label: string;
  value: string | number | React.ReactNode;
}

interface ContactSectionProps {
  title: string;
  items: ContactItem[];
  columns?: 1 | 2 | 3;
}

interface MedicalField {
  label: string;
  value?: string | React.ReactNode;
  tags?: TagItem[];
  bullets?: string[];
}

interface MedicalSectionProps {
  title: string;
  fields: MedicalField[];
  columns?: 1 | 2 | 3;
}

interface CurriculumCardProps {
  title: string;
  completedCount: number;
  totalCount: number;
  currentMilestone: string;
  gradeScore?: number;
  gradeTotal?: number;
}

interface InfoSectionProps {
  title: string;
  subtitle?: string;
  items: InfoItem[];
  columns?: number;
}

// Stats Card Component for the top section
export const StatsCard: React.FC<Stats> = ({ items = [] }) => {
  return (
    <Box className="bg-dashboard-bg md:bg-white md:border md:border-brandColor-active/20 rounded-lg md:p-6 mb-6">
      <Box
        className="flex flex-nowrap overflow-x-auto justify-between gap-6 [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:overflow-x-visible lg:justify-normal"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {items.map((item, idx) => (
          <Box
            key={idx}
            className="min-w-37.5 min-h-22.5 shrink-0 flex flex-col justify-between lg:min-w-0 lg:block bg-white md:bg-transparent p-4 md:p-0 rounded-lg"
          >
            <p className="text-sm text-primary-text-light mb-1">{item.label}</p>
            <p className="text-base font-medium text-[#101828] capitalize">{item.value}</p>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export function InfoSection({ title, subtitle, items, columns = 2 }: InfoSectionProps) {
  return (
    <section className="bg-white rounded-2xl p-6 -mx-1.5">
      {/* Section Title */}
      <h3 className="text-sm font-medium text-teal-600 mb-4 bg-profile-gray rounded-full w-fit p-3">
        {title}
      </h3>

      {/* Optional Subtitle (big heading) */}
      {subtitle && (
        <h4 className="text-lg font-semibold text-brandColor-active mb-2">{subtitle}</h4>
      )}

      {/* Grid of Info Items */}
      <Box className={`grid grid-cols-4 sm:grid-cols-${columns} gap-6`}>
        {items.map((item, idx) => (
          <Box key={idx} className="flex flex-col gap-3">
            <p className="text-sm text-brandColor-active">{item.label}</p>
            <p className="font-semibold text-teal-700">{item.value}</p>
          </Box>
        ))}
      </Box>
    </section>
  );
}

// General Information Section
export const GeneralInfoSection: React.FC<InfoSection2Props> = ({
  title,
  fields = [],
  childPhoto,
  childName,
}) => {
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <Box className="bg-white rounded-lg p-6">
      <h3 className="text-base font-semibold text-[#101828] pb-3 border-b border-border-lightGray">
        {title}
      </h3>
      <Box className="space-y-5 py-2 pt-5">
        {isMobile && (
          <Box className="flex flex-row gap-3">
            <InitialsAvatar
              src={childPhoto}
              name={childName}
              alt={childName ?? "parent image"}
              className="w-17.5 h-17.5"
              initialsClassName="text-xl"
            />
            <Box className="flex flex-col gap-2">
              <p className="text-[#3D3D3D] font-medium!">{childName}</p>
              <p className="text-[#001F1FB2]">{fields[0]?.value}</p>
            </Box>
          </Box>
        )}
        {fields.map((field, index) => (
          <Box
            key={index}
            className="grid grid-cols-2 items-start gap-10  pb-4 last:border-0 last:pb-0"
          >
            <p className="text-sm text-primary-text-dark min-w-30">{field.label}:</p>
            <p className="text-sm text-left font-semibold text-primary-text-dark flex-1">
              {field.value}
            </p>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const InfoSection2: React.FC<InfoSection2Props> = ({ title, fields }) => {
  return (
    <section className="bg-white rounded-2xl p-6 -mx-1.5">
      <h3 className="text-sm font-medium text-teal-600 mb-4 bg-profile-gray rounded-full w-fit p-3">
        {title}
      </h3>
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 text-sm">
        {fields.map((field, index) => (
          <Box key={index} className="flex flex-col gap-3">
            <p className="text-brandColor-active">{field.label}</p>
            <p className="font-semibold text-teal-700">{field.value}</p>
          </Box>
        ))}
      </Box>
    </section>
  );
};

// Medical Information Section with modern design
export const MedicalInfoSection: React.FC<MedicalSectionProps> = ({ title, fields }) => {
  return (
    <Box className="bg-white border border-brandColor-active/20 rounded-lg p-6">
      <h3 className="text-base font-semibold text-[#101828] pb-3 border-b border-border-lightGray">
        {title}
      </h3>
      <Box className="space-y-5 py-2 pt-5">
        {fields.map((field, idx) => (
          <Box key={idx} className=" pb-4 last:border-0 last:pb-0">
            <Box className="grid grid-cols-2 items-start gap-10">
              <p className="text-sm text-primary-text-dark min-w-[140px]">{field.label}:</p>
              <Box className="text-left flex-1">
                {/* If value is a string, show it */}
                {typeof field.value === "string" && (
                  <p className="text-sm font-semibold text-[#101828]">{field.value}</p>
                )}

                {/* If tags exist, show them inline */}
                {field.tags && field.tags.length > 0 && (
                  <p className="text-sm font-semibold text-[#101828]">
                    {field.tags.map((tag) => tag.label).join(", ")}
                  </p>
                )}

                {/* If bullets exist, show them as list */}
                {field.bullets && field.bullets.length > 0 && (
                  <ul className="text-sm font-semibold text-[#101828] space-y-1">
                    {field.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#667085] mt-1">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const CurriculumCard: React.FC<CurriculumCardProps> = ({
  title,
  completedCount,
  totalCount,
  currentMilestone,
  gradeScore = 0,
  gradeTotal = 3,
}) => {
  const safeTotal = totalCount > 0 ? totalCount : 0;
  const safeCompleted = Math.max(0, Math.min(completedCount, safeTotal || completedCount));
  const ratio = safeTotal > 0 ? safeCompleted / safeTotal : 0;
  const percent = Math.round(ratio * 100);

  return (
    <Box className="bg-white border border-brandColor-active/20 rounded-lg p-6">
      <h3 className="text-base font-semibold text-[#101828] pb-3 border-b border-border-lightGray">
        {title}
      </h3>
      <Box className="pt-5 space-y-4">
        <p className="text-sm text-primary-text-dark">
          {safeCompleted}/{safeTotal || 0} milestones completed
        </p>
        <p className="text-sm font-semibold text-primary-text-dark">{currentMilestone}</p>
        <Box className="flex justify-center py-2">
          <Box
            className="w-40 h-40 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(#008080 ${percent}%, #E2E8F0 ${percent}% 100%)`,
            }}
          >
            <Box className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
              <p className="text-3xl font-semibold text-[#101828]">
                {gradeScore}/{gradeTotal}
              </p>
              <p className="text-xs text-[#667085]">Score</p>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export const MedicalSection: React.FC<MedicalSectionProps> = ({ title, fields, columns = 2 }) => {
  const colClass =
    columns === 1 ? "sm:grid-cols-1" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";

  return (
    <section className="bg-white rounded-2xl p-6 -mx-1.5">
      <h3 className="text-sm font-medium text-teal-600 mb-4 bg-profile-gray rounded-full w-fit p-3">
        {title}
      </h3>

      <Box className={`grid grid-cols-1 ${colClass} gap-6 text-sm`}>
        {fields.map((field, idx) => (
          <Box
            key={idx}
            className={`flex flex-col gap-3 ${field.label.includes("Other") ? "col-start-2" : ""}`}
          >
            <p className="text-teal-600">{field.label}</p>

            {/* If tags exist, render them */}
            {field.tags ? (
              <Box className="flex flex-wrap gap-2 mt-1">
                {field.tags.map((tag, tIdx) => (
                  <Box
                    key={tIdx}
                    className={`flex gap-2 px-3 py-1 items-center bg-gray-100 text-gray-700 rounded-full text-xs`}
                  >
                    <Box
                      className={`h-2 w-2 rounded-full ${tag.colorClass || "bg-brandColor-active"}`}
                    />
                    <span
                      className={`text-${tag.colorClass?.replace("bg-", "") || "brandColor-active"} mt-0.5 }`}
                    >
                      {tag.label}
                    </span>
                  </Box>
                ))}
              </Box>
            ) : (
              <p className="font-semibold text-teal-700">{field.value}</p>
            )}
          </Box>
        ))}
      </Box>
    </section>
  );
};

// Emergency Contact Section updated to use a responsive "card/grid" layout matching MedicalSection
export const EmergencyContactSection: React.FC<ContactSectionProps> = ({
  title,
  items = [],
  columns = 2,
}) => {
  const colClass =
    columns === 1 ? "sm:grid-cols-1" : columns === 2 ? "sm:grid-cols-1" : "sm:grid-cols-3";

  return (
    <Box className="bg-white border border-brandColor-active/20 rounded-lg p-6">
      <h3 className="text-base font-semibold text-[#101828] pb-3 border-b border-border-lightGray">
        {title}
      </h3>
      <Box className={`grid grid-cols-1 ${colClass} gap-6 text-sm md:space-y-3 py-2 pt-5 w-full`}>
        {items.map((item, idx) => (
          <Box key={idx} className="flex md:flex-row gap-3">
            <p className="text-sm text-primary-text-dark min-w-30">{item.label}:</p>
            <p className="text-sm font-semibold text-primary-text-dark text-nowrap">{item.value}</p>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const ContactSection: React.FC<ContactSectionProps> = ({ title, items, columns = 2 }) => {
  const colClass =
    columns === 1 ? "sm:grid-cols-1" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";

  return (
    <section className="bg-white rounded-2xl p-6 -mx-1.5">
      <h3 className="text-sm font-medium text-teal-600 mb-4 bg-profile-gray rounded-full w-fit p-3">
        {title}
      </h3>

      <Box className={`grid grid-cols-1 ${colClass} gap-6 text-sm`}>
        {items.map((item, idx) => (
          <Box key={idx} className="flex flex-col gap-3">
            <p className="text-teal-600">{item.label}</p>
            <p className="font-semibold text-teal-700">{item.value}</p>
          </Box>
        ))}
      </Box>
    </section>
  );
};