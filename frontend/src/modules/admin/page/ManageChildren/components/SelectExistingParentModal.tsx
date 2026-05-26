/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect, useRef, type UIEvent } from "react";
import { Box, Typography, IconButton, InputAdornment } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { Modal } from "@/modules/shared/component/modal";
import { Button } from "@/modules/shared/component/Button";
import { TextField } from "@/modules/shared/component/TextField";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { parentServices } from "@/services/parent.service";
import type { ParentProps } from "../child.constant";
import SuccessCheckIcon from "@/modules/shared/assets/svgs/successIcon.svg";
export type ApiParent = {
  id: number;
  suffix?: string | null;
  relationship?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
};

function mapApiParentToForm(apiParent: ApiParent): ParentProps {
  const u = apiParent.user;
  return {
    id: apiParent.id,
    suffix: apiParent.suffix ?? "",
    title: apiParent.suffix ?? "",
    firstName: u?.firstName ?? "",
    lastName: u?.lastName ?? "",
    relationship: apiParent.relationship ?? "",
    phone: u?.phone ?? "",
    email: u?.email ?? "",
    address: u?.address ?? "",
    photoUrl: apiParent.photoUrl ?? null,
    notes: apiParent.notes ?? "",
  };
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = (firstName ?? "").trim().charAt(0).toUpperCase();
  const l = (lastName ?? "").trim().charAt(0).toUpperCase();
  if (f && l) return `${f}${l}`;
  if (f) return f;
  if (l) return l;
  return "?";
}

interface SelectExistingParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (parents: ParentProps[]) => void;
  /** Ids of parents currently in the form (from previous selection or loaded child). Modal opens with these pre-selected so user can unselect/edit. */
  initialSelectedIds?: number[];
}

export function SelectExistingParentModal({
  isOpen,
  onClose,
  onSelect,
  initialSelectedIds = [],
}: SelectExistingParentModalProps) {
  const [search, setSearch] = useState("");
  /** Selected parent ids in order of selection (supports multiple). */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const wasOpenRef = useRef(false);

  // When modal opens, sync selection to form's current parents (so user sees what's already selected and can unselect)
  useEffect(() => {
    if (isOpen) {
      if (!wasOpenRef.current) {
        setSelectedIds(Array.isArray(initialSelectedIds) ? [...initialSelectedIds] : []);
      }
      wasOpenRef.current = true;
    } else {
      wasOpenRef.current = false;
    }
  }, [isOpen, initialSelectedIds]);

  const parentListService = useMemo(
    () => ({
      ...parentServices.getAllParents,
      data: {
        delta: 10,
        sortBy: "firstName",
        sortOrder: "ASC",
        ...(search.trim() ? { search: search.trim() } : {}),
      },
    }),
    [search],
  );

  const {
    data: parentPages,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQueryService<any, any>({
    service: parentListService,
    options: { enabled: isOpen },
  });

  const parentsList: ApiParent[] = useMemo(() => {
    const pages = parentPages?.pages ?? [];
    const allParents = pages.flatMap((page: any) => {
      const raw = page?.data?.parents ?? page?.parents ?? page?.data?.data?.parents ?? [];
      return Array.isArray(raw) ? raw : [];
    });
    const seen = new Set<number>();
    return allParents.filter((p: ApiParent) => {
      if (p?.id == null || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [parentPages]);

  const loadMoreParents = async () => {
    if (!hasNextPage || isFetchingNextPage) return;
    await fetchNextPage();
  };



  const handleParentsListScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 48) {
      void loadMoreParents();
    }
  };

  const filteredList = useMemo(() => {
    if (!search.trim()) return parentsList;
    const q = search.trim().toLowerCase();
    return parentsList.filter((p: ApiParent) => {
      const name = `${p.user?.firstName ?? ""} ${p.user?.lastName ?? ""}`.toLowerCase();
      const email = (p.user?.email ?? "").toLowerCase();
      const phone = (p.user?.phone ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [parentsList, search]);

  const toggleParent = (parent: ApiParent) => {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(parent.id);
      if (idx >= 0) return prev.filter((id) => id !== parent.id);
      return [...prev, parent.id];
    });
  };

  const handleSelectParents = () => {
    if (selectedIds.length === 0) return;
    const idToParent = new Map(parentsList.map((p: ApiParent) => [p.id, p]));
    const ordered = selectedIds.map((id) => idToParent.get(id)).filter(Boolean) as ApiParent[];
    onSelect(ordered.map(mapApiParentToForm));
    setSelectedIds([]);
    setSearch("");
    onClose();
  };

  const handleClose = () => {
    setSelectedIds([]);
    setSearch("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="!w-full !max-w-lg !rounded-xl !p-0 overflow-hidden flex flex-col max-h-[90vh]"
    >
      {/* Header */}
      <Box className="flex items-center justify-between border-b border-border-lightGray px-5 py-4">
        <Typography className="!font-semibold !text-lg !text-primary-dark">
          Select Existing Parent/Guardian
        </Typography>
        <IconButton size="small" onClick={handleClose} className="!p-1">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Search */}
      <Box className="px-5 !py-4 ">
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          fullWidth
          startIcon={<SearchIcon className="!text-text-gray" fontSize="small" />}
          size="small"
          className="w-full"
          inputClasses="!pl-2 !h-10 !text-sm "
        />
      </Box>

      {/* List */}
      <Box
        className="flex-1 overflow-y-auto px-5 pb-4 min-h-[200px] max-h-[50vh]"
        onScroll={handleParentsListScroll}
      >
        {isLoading ? (
          <Typography className="!text-sm !text-text-gray py-4">Loading parents...</Typography>
        ) : filteredList.length === 0 ? (
          <Typography className="!text-sm !text-text-gray py-4">
            No parents found. Try a different search.
          </Typography>
        ) : (
          <Box className="flex flex-col gap-2">
            {filteredList.map((parent: ApiParent) => {
              const isSelected = selectedIds.includes(parent.id);
              const u = parent.user;
              const suffix = parent.suffix ?? "";
              const displayName = `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || "—";
              const relationship =
                (parent.relationship ?? "").trim() &&
                (parent.relationship as string).charAt(0).toUpperCase() +
                  (parent.relationship as string).slice(1).toLowerCase();
              return (
                <button
                  key={parent.id}
                  type="button"
                  onClick={() => toggleParent(parent)}
                  className={`flex items-center gap-3 w-full text-left cursor-pointer p-3 rounded-xl border transition-colors ${
                    isSelected
                      ? "!bg-brandColor-active/10 !border-brandColor-active"
                      : "! border-border-lightGray hover:!bg-gray-100"
                  }`}
                >
                  <Box
                    className="w-12 h-12 rounded-full flex items-center justify-center !bg-orange-200 !text-orange-800 !font-semibold !text-base shrink-0"
                    sx={{ backgroundColor: "rgba(251, 146, 60, 0.3)", color: "#9a3412" }}
                  >
                    {getInitials(u?.firstName, u?.lastName)}
                  </Box>
                  <Box className="flex-1 min-w-0">
                    <Typography className="!font-semibold !text-primary-dark !text-sm truncate">
                      {suffix && (
                        <span className="mr-1">{suffix}</span>
                      )}
                      {displayName}
                    </Typography>
                    <Box className="flex items-center gap-2">
                      {relationship && (
                        <Typography className="!text-xs !text-text-gray !font-normal">
                          {relationship}
                        </Typography>
                      )}{" "}
                      <span className="w-[2.5px] bg-black h-[2.5px] rounded-full " />
                      <Typography className="!text-xs !text-text-gray truncate inline-bloc">
                        {u?.email ?? "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                  {isSelected && (
                    <SuccessCheckIcon className="!text-text-gray" fontSize="small" />
                  )}
                </button>
              );
            })}
            {isFetchingNextPage ? (
              <Typography className="!text-xs !text-text-gray py-3 text-center">
                Loading more…
              </Typography>
            ) : null}
          </Box>
        )}
      </Box>

      {/* Actions */}
      <Box className="flex justify-end gap-2 border-t border-border-lightGray px-5 py-4">
        {selectedIds.length > 0 && (
          <Typography className="!text-sm !text-text-gray self-center mr-auto">
            {selectedIds.length} selected
          </Typography>
        )}
        <Button
          variant="outlined"
          onClick={handleClose}
          className="!rounded-lg !px-6 !bg-background-offwhite/50 !text-primary-dark !border !border-border-table"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSelectParents}
          disabled={selectedIds.length === 0}
          className="!px-6 !py-2 !rounded-lg"
        >
          {selectedIds.length <= 1 ? "Select Parent" : "Select Parents"}
        </Button>
      </Box>
    </Modal>
  );
}
