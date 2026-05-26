"use client";

import React, { useState } from "react";
import { Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";
import { ReusableInput } from "@/modules/shared/component/CustomInputField";
import useSearchMenu from "./hook/useParentSearchMenu";
import { useGlobalSearch } from "@/components/SearchMenu/hook/useGlobalSearch";
import { GlobalSearchResults } from "@/components/SearchMenu/components/GlobalSearchResults";
import Link from "next/link";

interface SearchMenuProps {
  open?: boolean;
  onClose?: () => void;
}

const ParentSearchMenu: React.FC<SearchMenuProps> = ({ onClose }) => {
  const [searchText, setSearchText] = useState("");
  const { searchMenuItems } = useSearchMenu();
  const { results, isLoading, hasSearched } = useGlobalSearch(searchText);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <Box className="!bg-transparent rounded-xl font-sans !max-w-lg !w-[480px]">
      <div className="flex justify-between items-center p-3">
        <h2 className="text-lg !font-medium text-gray-800">Search menu</h2>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose?.();
          }}
          className="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer !-space-x-2"
          type="button"
        >
          <CloseIcon fontSize="inherit" />
        </button>
      </div>

      <div className="px-3 space-y-3 !text-text-tertiary/70">
        <ReusableInput
          variant="search"
          value={searchText}
          onChange={handleSearchChange}
          startAdornment={<SearchIcon fontSize="medium" />}
          inputClassName="flex !text-text-tertiary placeholder:!text-text-tertiary/70"
          showDefaultAdornment={false}
          sx={{
            borderRadius: "12px",
            cursor: "text",
            "::placeholder": "#001F1F",
          }}
          placeholder="Search.."
          className="placeholder:!text-text-tertiary/70 !text-text-tertiary/70 "
        />
      </div>

      {hasSearched ? (
        <div className="p-3 border-t border-gray-100">
          <GlobalSearchResults
            results={results}
            isLoading={isLoading}
            hasSearched={hasSearched}
            role="parent"
            onResultClick={handleLinkClick}
          />
        </div>
      ) : (
        <div className="p-3 !text-sm space-y-2">
          <div className="text-table-text font-medium">Quick Actions</div>
          <div className="grid grid-cols-2 gap-3">
            {searchMenuItems?.map((action, idx) => (
              <Link
                key={idx}
                className="flex justify-between items-center px-2.5 py-3 !text-sm cursor-pointer border border-gray-200 rounded-lg text-text-tertiary/70 hover:bg-gray-50 transition-colors"
                href={action.route}
                onClick={handleLinkClick}
              >
                <span>{action.name}</span>
                <ChevronRightIcon className="text-gray-400" fontSize="small" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </Box>
  );
};

export default ParentSearchMenu;
