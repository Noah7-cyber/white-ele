"use client";

import { useState } from "react";
import { Box, Typography, styled, Switch } from "@mui/material";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import {
  ACTION_LABELS,
  PERMISSION_ACTIONS,
  type PermissionGroup,
} from "./roles.constants";
import type { RolePermission, RolePermissionAction } from "@/services/roles.service";

const AntSwitch = styled(Switch)(() => ({
  width: 32,
  height: 18,
  padding: 0,
  display: "flex",
  "& .MuiSwitch-switchBase": {
    padding: 2,
    "&.Mui-checked": {
      transform: "translateX(14px)",
      color: "#fff",
      "& + .MuiSwitch-track": { opacity: 1, backgroundColor: "#007C79", border: 0 },
    },
  },
  "& .MuiSwitch-thumb": { width: 14, height: 14, boxShadow: "none" },
  "& .MuiSwitch-track": {
    borderRadius: 9,
    opacity: 1,
    backgroundColor: "#E9E9EA",
    boxSizing: "border-box",
  },
}));

function getGroupActionState(
  permissions: RolePermission[],
  resources: string[],
  action: RolePermissionAction,
): boolean {
  const relevant = permissions.filter((p) => resources.includes(p.resource));
  if (relevant.length === 0) return false;
  return relevant.every((p) => p.actions[action]);
}

interface PermissionGroupSectionProps {
  group: PermissionGroup;
  permissions: RolePermission[];
  defaultExpanded?: boolean;
  disabled?: boolean;
  onToggle: (action: RolePermissionAction, enabled: boolean) => void;
}

export const PermissionGroupSection = ({
  group,
  permissions,
  defaultExpanded = false,
  disabled = false,
  onToggle,
}: PermissionGroupSectionProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Box className="rounded-lg border border-[#E4E7EC] bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between mx-4 py-3.5 text-left hover:bg-[#F9FAFB] transition-colors border-b border-[#F2F4F7]"
      >
        <Typography className="text-sm! font-semibold! text-[#022F2F]!">{group.label}</Typography>
        <ExpandMoreIcon
          className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <Box className="flex flex-col gap-1 px-4 pb-3 pt-1">
          {PERMISSION_ACTIONS.map((action) => {
            const checked = getGroupActionState(permissions, group.resources, action);
            return (
              <Box
                key={action}
                className="flex items-center justify-between py-2.5"
              >
                <Typography className="text-sm! text-[#344054]!">{ACTION_LABELS[action]}</Typography>
                <AntSwitch
                  checked={checked}
                  disabled={disabled}
                  onChange={(e) => onToggle(action, e.target.checked)}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
