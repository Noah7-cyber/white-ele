import React, { ChangeEvent, ReactNode, useEffect, useRef } from "react";

import { Checkbox as MUICheckbox } from "@mui/material";
import { SxProps, Theme } from "@mui/material";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog, { DialogProps } from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";

import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";

import classNames from "classnames";

import { InfiniteScroll } from "../InfiniteScroll";
import { TextField, TextFieldProps } from "../TextField";
import { useDropdown } from "./hooks/useDropdown";

import "./dropdown.css";

export type DropdownValue = object | string | number | boolean | null;

export type DropdownOptionProps<T extends DropdownValue = DropdownValue> =
  | string[]
  | number[]
  | DropdownOption<T>[];
// | number;
export interface DropdownOption<T extends DropdownValue = DropdownValue> {
  value: T;
  name: Exclude<DropdownValue, object>;
  component?: React.ReactNode;
  endIcon?: React.ReactNode;
  preventSelect?: boolean;
  disabled?: boolean;
}

export interface DropdownProps<T extends DropdownValue = DropdownValue> {
  requiredAsterisk?: boolean;
  isOpen?: boolean;
  hideIcon?: boolean;
  isForm?: boolean;
  keepOpen?: boolean;
  hasCheck?: boolean;
  hasSearch?: boolean;
  emptyState?: ReactNode;
  isLoading?: boolean;
  readOnly?: boolean;
  isMultipleSelect?: boolean;
  disabled?: boolean;
  hideModal?: boolean;

  itemClassName?: string;
  itemTextClassName?: string;
  titleClassName?: string;
  dialogClassName?: string;
  dialogTitleClasses?: string;
  dialogBodyClassName?: string;
  textFieldClassName?: string;
  searchInputClassName?: string;
  searchContainerClassName?: string;
  errorText?: string;
  isError?: boolean;

  textFieldProps?: TextFieldProps;
  searchPlaceholder?: string;
  maxHeight?: number;
  minWidth?: number;
  dialogWidth?: number;
  maxDialogWidth?: number;
  title?: ReactNode;
  /** Renders on top right above the textfield, same row as label (e.g. "+ Add new curriculum" link or button) */
  headerAction?: ReactNode;

  value?: T | DropdownOption<T>;
  options: DropdownOptionProps<T>;
  triggerIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  triggerComponent?: React.ReactNode;
  selectedValues?: T[] | DropdownOption<T>[];

  onSelectedValues?: (values: T[]) => void;
  onClose?: () => void;
  onOpen?: () => void;
  handleClickOpen?: React.MouseEventHandler<HTMLButtonElement>;
  handleSearch?: (value: string) => void;
  onSelect?: (value: T, option: DropdownOption<T>) => void;
  onChangeValue?: (value: T, option: DropdownOption<T>) => void;
  onDisableClick?: () => void;
  dialogProps?: Omit<DialogProps, "open">;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLoadMore?: () => Promise<any>;
  hasMore?: boolean;
  alignDialog?: {
    vertical?: "top" | "bottom" | "center" | "screen";
    horizontal?: "left" | "right" | "center" | "screen";
  };
  offset?: {
    vertical?: number;
    horizontal?: number;
  };
  emptyStateClassName?: string;
  backdropStyles?: SxProps<Theme>;
}

export const Dropdown = <T extends DropdownValue = DropdownValue>(props: DropdownProps<T>) => {
  const {
    title,
    headerAction,
    isForm,
    endIcon,
    isLoading,
    hasSearch,
    triggerIcon,
    emptyState,
    textFieldProps,
    isMultipleSelect,
    triggerComponent,
    dialogTitleClasses,
    searchContainerClassName,
    searchInputClassName,
    searchPlaceholder,
    titleClassName,
    dialogClassName,
    dialogBodyClassName,
    itemTextClassName,
    itemClassName,
    hasCheck = true,
    errorText,
    emptyStateClassName,
    dialogProps,
    hideIcon,
    hideModal,
    backdropStyles,
  } = props;

  // Ensure multi-select keeps dialog open by default
  const computedProps: DropdownProps<T> = {
    ...props,
    keepOpen: props.keepOpen ?? props.isMultipleSelect ?? false,
  };

  const {
    open,
    search,
    selected,
    handleClose,
    handleSelect,
    triggerWidth,
    handleSearch,
    displayValue,
    anchorPosition,
    handleClickOpen,
    dropdownOptions,
    onClickTextField,
    multipleSelection,
    loadMoreOptions,
    hasMoreOptions,
    dialogWidth,
    dialogHeight,
    triggerRef,
  } = useDropdown<T>(computedProps);

  const menuListRef = useRef<HTMLUListElement | null>(null);
  const selectedRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (selectedRef.current && menuListRef.current) {
          selectedRef.current.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }, 50);
    }
  }, [open]);

  const handleSelectWithReset = (option: DropdownOption<T>, event: React.MouseEvent) => {
    if (isMultipleSelect) {
      const optionValue = JSON.stringify(option.value);
      const selectedValues = (multipleSelection || []).map((v) => JSON.stringify(v));

      let updatedSelection: T[];

      if (selectedValues.includes(optionValue)) {
        // remove from selection
        updatedSelection = multipleSelection.filter(
          (v) => JSON.stringify(v) !== optionValue,
        ) as T[];
      } else {
        // add to selection
        updatedSelection = [...multipleSelection, option.value] as T[];
      }

      props.onSelectedValues?.(updatedSelection);
      handleSelect(option, event as React.MouseEvent<HTMLLIElement, MouseEvent>);
      return;
    }

    // single select: keep selection when clicking the same value (do not deselect)
    const isSelected = JSON.stringify(selected) === JSON.stringify(option.value);
    if (isSelected) {
      // Re-emit selection for flows that need to react even when value is unchanged
      // (e.g. reopening Custom date picker when "Custom" is already selected).
      props.onSelect?.(option.value, option);
      if (!computedProps.keepOpen) handleClose();
      return;
    }

    handleSelect(option, event as React.MouseEvent<HTMLLIElement, MouseEvent>);
    handleSearch({ target: { value: "" } } as ChangeEvent<HTMLInputElement>);
  };

  const dropdownButton = () => {
    if (hideIcon) return null;

    return (
      triggerIcon || (
        <IconButton
          size="small"
          // onClick={handleClickOpen}
          className="!bg-skyblue-shade rounded-full p-0 flex items-center justify-center"
        >
          <ExpandMoreIcon
            className={classNames("duration-150", open ? "rotate-180" : undefined)}
            style={{ transform: "scale(0.8) " }}
          />
        </IconButton>
      )
    );
  };

  return (
    <>
      {isForm ? (
        <Box
          className="w-full cursor-pointer"
          onClick={(e) => onClickTextField(e as React.MouseEvent<HTMLDivElement, MouseEvent>)}
          ref={triggerRef}
        >
          {headerAction && (
            <Box className="flex items-center justify-between gap-3 -mb-1">
              {textFieldProps?.label != null ? (
                <label className="bd-text-field-label text-sm font-medium text-primary-dark">
                  {textFieldProps.label}
                  {props.requiredAsterisk && <span className="text-red-500 ml-0.5">*</span>}
                </label>
              ) : (
                <Box />
              )}
              <Box
                className="flex-shrink- !cursor-pointer !hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {headerAction}
              </Box>
            </Box>
          )}
          <TextField
            readOnly
            value={displayValue}
            endIcon={dropdownButton()}
            errorText={errorText}
            requiredAsterisk={props.requiredAsterisk}
            {...textFieldProps}
            {...(headerAction && textFieldProps?.label != null
              ? { label: undefined, labelOnTop: false }
              : {})}
          />
        </Box>
      ) : triggerComponent ? (
        <>
          <div className="cursor-pointer" onClick={handleClickOpen} ref={triggerRef}>
            {triggerComponent}
          </div>
          {errorText && <span className="text-danger -mt-3">{errorText}</span>}
        </>
      ) : (
        dropdownButton()
      )}
      {!hideModal && (
        <Dialog
          {...dialogProps}
          open={open}
          onClick={(event) => event.stopPropagation()}
          onClose={handleClose}
          classes={{
            container: "!bg-blue",
          }}
          slotProps={{
            backdrop: {
              sx: backdropStyles,
            },
          }}
          className={classNames("dropdown-select-dialog", dialogClassName)}
          PaperProps={{
            className: classNames("!rounded-lg !shadow-none", dialogClassName),
            sx: {
              position: "absolute",
              ...(anchorPosition.top != null && { top: `${anchorPosition.top}px` }),
              ...(anchorPosition.left != null && { left: `${anchorPosition.left}px` }),
              ...(anchorPosition.bottom != null && { bottom: `${anchorPosition.bottom}px` }),
              ...(anchorPosition.right != null && { right: `${anchorPosition.right}px` }),
              width: `${triggerWidth}px`,
              minWidth: `${triggerWidth}px`,
              maxWidth: `${triggerWidth}px`,
              maxHeight: "min(65dvh, 420px)",
              margin: 0,
              boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
            },
          }}
        >
          {(title || hasSearch) && (
            <DialogTitle className={classNames("!p-0", dialogTitleClasses)}>
              {typeof title === "string" ? (
                <Typography
                  className={classNames(
                    "bd-dropdown-title pt-5 pb-4 pl-6 !text-xl !font-means",
                    titleClassName,
                  )}
                >
                  {title}
                </Typography>
              ) : (
                title
              )}
              {hasSearch && (
                <DropdownSearch
                  autofocus
                  handleSearch={handleSearch}
                  value={search}
                  inputClassName={searchInputClassName}
                  containerClassName={searchContainerClassName}
                  placeholder={
                    searchPlaceholder || title ? `Search ${searchPlaceholder || title}` : "Search"
                  }
                />
              )}
            </DialogTitle>
          )}
          <DialogContent
            className={classNames("!px-3 !py-1.5", dialogBodyClassName)}
            sx={{
              maxHeight: Math.min(dialogHeight || 300, 360),
              overflowY: "auto",
              padding: 0,
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c1c1c1",
                borderRadius: "8px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#a8a8a8",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f0f0f0",
              },
            }}
          >
            {dropdownOptions.length === 0 && !isLoading && emptyState ? (
              <Box
                className={classNames("flex justify-center items-center h-32", emptyStateClassName)}
              >
                {emptyState}
              </Box>
            ) : isLoading ? (
              <Box component="div" className="flex h-32 flex-col justify-center items-center">
                <CircularProgress thickness={4} />
              </Box>
            ) : (
              <MenuList className="menu-list" ref={menuListRef} sx={{ padding: 0 }}>
                <InfiniteScroll onLoadMore={loadMoreOptions} hasMore={hasMoreOptions}>
                  {dropdownOptions?.map((option, index) => {
                    const isSelected = JSON.stringify(selected) === JSON.stringify(option.value);

                    return (
                      <MenuItem
                        key={index}
                        ref={isSelected ? selectedRef : null}
                        disabled={Boolean(option.disabled)}
                        onClick={(event) => handleSelectWithReset(option, event)}
                        className={classNames(
                          "!py-2 !px-2 !hover:bg-skyblue-shade",
                          option.disabled && "!text-text-tertiary/70 !cursor-not-allowed",
                          itemClassName,
                        )}
                      >
                        {isMultipleSelect && (hasCheck || endIcon || option.endIcon) && (
                          <ListItemIcon>
                            <MUICheckbox
                              size="small"
                              checked={(multipleSelection || []).some(
                                (v) => v === JSON.stringify(option.value),
                              )}
                              sx={{ padding: 0, marginLeft: "", borderRadius: 30 }}
                            />
                          </ListItemIcon>
                        )}
                        <div
                          className={classNames(
                            "!text-wrap !text-xs flex-1 !font-normal",
                            itemTextClassName,
                          )}
                        >
                          {option.component || <span>{option.name}</span>}
                        </div>
                      </MenuItem>
                    );
                  })}
                </InfiniteScroll>
              </MenuList>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

interface SelectSearchProps {
  handleSearch?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  value?: string;
  placeholder?: string;
  inputClassName?: string;
  containerClassName?: string;
  autofocus?: boolean;
}

export const DropdownSearch: React.FC<SelectSearchProps> = ({
  value,
  handleSearch,
  placeholder,
  inputClassName,
  containerClassName,
  autofocus,
}) => {
  const textRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autofocus && textRef.current) textRef.current?.focus();
  }, [autofocus]);

  return (
    <Box className={classNames("bg-mistGray px-5 pt-[17.5px]", containerClassName)}>
      <TextField
        isSearch
        inputRef={textRef}
        value={value}
        placeholder={placeholder}
        onChange={handleSearch}
        className={inputClassName}
      />
    </Box>
  );
};
