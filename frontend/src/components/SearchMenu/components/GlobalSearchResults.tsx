/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import CampaignIcon from "@mui/icons-material/Campaign";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import EscalatorWarningIcon from '@mui/icons-material/EscalatorWarning';
import SubjectIcon from "@mui/icons-material/Subject";
import FlagIcon from "@mui/icons-material/Flag";
import GradingIcon from "@mui/icons-material/Grading";
import Link from "next/link";
import {
  GlobalSearchResults as ResultsType,
  GlobalSearchPerson,
  GlobalSearchNamedItem,
} from "@/services/globalSearch.service";
import { getSearchResultRoute, SearchRole } from "../utils/searchResultRoutes";

interface GlobalSearchResultsProps {
  results: ResultsType | null;
  isLoading: boolean;
  hasSearched: boolean;
  role: SearchRole;
  onResultClick?: () => void;
}

const SECTION_CONFIG: Record<
  keyof ResultsType,
  { label: string; icon: React.ReactNode; hasRoute: boolean }
> = {
  student: { label: "Students", icon: <PersonIcon fontSize="small" />, hasRoute: true },
  classroom: { label: "Classrooms", icon: <SchoolIcon fontSize="small" />, hasRoute: true },
  staff: { label: "Staff", icon: <PersonIcon fontSize="small" />, hasRoute: true },
  admin: { label: "Admins", icon: <SupervisorAccountIcon fontSize="small" />, hasRoute: true },
  parent: { label: "Parents", icon: <EscalatorWarningIcon fontSize="small" />, hasRoute: true },
  announcement: { label: "Announcements", icon: <CampaignIcon fontSize="small" />, hasRoute: true },
  curriculum: { label: "Curriculum", icon: <MenuBookIcon fontSize="small" />, hasRoute: true },
  subject: { label: "Subjects", icon: <SubjectIcon fontSize="small" />, hasRoute: true },
  milestone: { label: "Milestones", icon: <FlagIcon fontSize="small" />, hasRoute: true },
  assessment: { label: "Assessments", icon: <GradingIcon fontSize="small" />, hasRoute: true },
};

function PersonResult({
  item,
  entityType,
  role,
  onResultClick,
}: {
  item: GlobalSearchPerson;
  entityType: "student" | "staff" | "admin" | "parent";
  role: SearchRole;
  onResultClick?: () => void;
}) {
  const route = getSearchResultRoute(role, entityType, item.id);
  const displayName = `${item.firstName} ${item.lastName}`.trim() || "Unknown";
  const subtitle = item.email || undefined;

  if (!route) {
    return (
      <Box className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-default opacity-70">
        <PersonIcon className="!text-text-tertiary/50" fontSize="small" />
        <Box className="flex-1 min-w-0">
          <Typography className="!text-sm !font-medium !text-text-tertiary truncate">
            {displayName}
          </Typography>
          {subtitle && (
            <Typography className="!text-xs !text-text-tertiary/70 truncate">{subtitle}</Typography>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Link
      href={route}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
      onClick={onResultClick}
    >
      <PersonIcon
        className="!text-text-tertiary/70 group-hover:!text-brandColor-active"
        fontSize="small"
      />
      <Box className="flex-1 min-w-0">
        <Typography className="!text-sm !font-medium !text-text-tertiary group-hover:!text-primary-dark truncate">
          {displayName}
        </Typography>
        {subtitle && (
          <Typography className="!text-xs !text-text-tertiary/70 truncate">{subtitle}</Typography>
        )}
      </Box>
      <ChevronRightIcon
        className="!text-gray-400 group-hover:!text-brandColor-active"
        fontSize="small"
      />
    </Link>
  );
}

function NamedItemResult({
  item,
  entityType,
  role,
  icon,
  onResultClick,
}: {
  item: GlobalSearchNamedItem;
  entityType: keyof ResultsType;
  role: SearchRole;
  icon: React.ReactNode;
  onResultClick?: () => void;
}) {
  const route = getSearchResultRoute(role, entityType as any, item.id);

  if (!route) {
    return (
      <Box className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-default opacity-70">
        {icon}
        <Typography className="!text-sm !font-medium !text-text-tertiary truncate flex-1">
          {item.name}
        </Typography>
      </Box>
    );
  }

  return (
    <Link
      href={route}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
      onClick={onResultClick}
    >
      <Box className="!text-text-tertiary/70 group-hover:!text-brandColor-active">{icon}</Box>
      <Typography className="!text-sm !font-medium !text-text-tertiary group-hover:!text-primary-dark truncate flex-1">
        {item.name}
      </Typography>
      <ChevronRightIcon
        className="!text-gray-400 group-hover:!text-brandColor-active"
        fontSize="small"
      />
    </Link>
  );
}

export const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = ({
  results,
  isLoading,
  hasSearched,
  role,
  onResultClick,
}) => {
  if (isLoading && hasSearched) {
    return (
      <Box className="flex justify-center py-8">
        <CircularProgress size={28} className="!text-brandColor-active" />
      </Box>
    );
  }

  if (!hasSearched || !results) {
    return null;
  }

  const hasAnyResults = Object.values(results).some((arr) => arr && arr.length > 0);
  if (!hasAnyResults) {
    return (
      <Box className="py-6 px-4 text-center">
        <Typography className="!text-sm !text-text-tertiary/70">No results found</Typography>
      </Box>
    );
  }

  return (
    <Box className="space-y-4 max-h-[320px] overflow-y-auto">
      {(Object.keys(results) as (keyof ResultsType)[]).map((key) => {
        const items = results[key];
        if (!items || items.length === 0) return null;

        const config = SECTION_CONFIG[key];
        if (!config) return null;

        return (
          <Box key={key}>
            <Typography
              className="!text-xs !font-semibold !text-text-tertiary/70 uppercase tracking-wide mb-2 flex items-center gap-1.5"
              variant="caption"
            >
              {config.icon}
              {config.label}
            </Typography>
            <Box className="space-y-0.5">
              {"firstName" in items[0]
                ? (items as GlobalSearchPerson[]).map((item) => (
                    <PersonResult
                      key={`${key}-${item.id}`}
                      item={item}
                      entityType={key as "student" | "staff" | "admin" | "parent"}
                      role={role}
                      onResultClick={onResultClick}
                    />
                  ))
                : (items as GlobalSearchNamedItem[]).map((item) => (
                    <NamedItemResult
                      key={`${key}-${item.id}`}
                      item={item}
                      entityType={key}
                      role={role}
                      icon={config.icon}
                      onResultClick={onResultClick}
                    />
                  ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
