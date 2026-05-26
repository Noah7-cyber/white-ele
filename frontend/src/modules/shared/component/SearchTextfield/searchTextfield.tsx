import React, { FC, useMemo, useState } from "react";
import { TextField, TextFieldProps } from "../TextField";
import SearchIcon from "@/modules/shared/assets/svgs/searchIcon.svg";
import { Box } from "@mui/material";
import { useGlobalSearch } from "@/components/SearchMenu/hook/useGlobalSearch";
import { GlobalSearchResults } from "@/components/SearchMenu/components/GlobalSearchResults";
import { SearchRole } from "@/components/SearchMenu/utils/searchResultRoutes";

interface SearchTextfieldProps extends TextFieldProps {
  role?: SearchRole;
  endAction?: React.ReactNode;
}

export const SearchTextfield: FC<SearchTextfieldProps> = ({ role, endAction, ...props }) => {
  const [searchText, setSearchText] = useState(String(props.defaultValue ?? ""));
  const [isFocused, setIsFocused] = useState(false);
  const isControlled = props.value !== undefined;
  const inputValue = isControlled ? String(props.value ?? "") : searchText;
  const { results, isLoading, hasSearched } = useGlobalSearch(inputValue);

  const shouldShowResults = useMemo(
    () => Boolean(role && isFocused && inputValue.trim().length >= 2),
    [role, isFocused, inputValue],
  );

  return (
    <Box className="relative w-full">
      <TextField
        {...props}
        startIcon={<SearchIcon />}
        endIcon={endAction}
        placeholder="Search by name, class, etc"
        className="!bg-white mt-0! rounded-2xl! sm:rounded-lg w-full max-sm:!border-none max-sm:!border-transparent"
        inputClasses="mt-0!"
        fullWidth
        value={inputValue}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          window.setTimeout(() => setIsFocused(false), 150);
        }}
        onChange={(event) => {
          setSearchText(event.target.value);
          props.onChange?.(event);
        }}
      />
      {role && shouldShowResults && (
        <Box className="absolute left-0 right-0 mt-2 z-50 bg-white sm:border border-border-lightGray rounded-xl p-3 shadow-md max-h-[320px] overflow-y-auto">
          <GlobalSearchResults
            results={results}
            isLoading={isLoading}
            hasSearched={hasSearched}
            role={role}
            onResultClick={() => setIsFocused(false)}
          />
        </Box>
      )}
    </Box>
  );
};
