import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { ITEMS_PER_PAGE, DEFAULT_DROPDOWN_WIDTH } from "@/constants";
import { getDialogRenderPosition, getDropdownHeight } from "@/utils/hooks/getDialogRenderPosition";

import { DropdownOption, DropdownProps, DropdownValue } from "../dropdown";

export function useDropdown<T extends DropdownValue>(arg: DropdownProps<T>) {
  const {
    value,
    options,
    onClose,
    onSelect,
    minWidth,
    maxHeight,
    onChangeValue,
    isOpen,
    alignDialog,
    selectedValues,
    isMultipleSelect,
    onSelectedValues,
    onLoadMore,
    hasMore,
    offset,
    handleSearch: onSearch,
    dialogWidth: width,
    title,
    hasSearch,
    readOnly,
    keepOpen,
    disabled,
    onOpen,
    onDisableClick,
  } = arg;
  const [multipleSelection, setMultipleSelection] = useState<string[]>([]);
  const [triggerWidth, setTriggerWidth] = useState<number>(0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<T>();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [anchorPosition, setAnchorPosition] = useState<{
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
  }>({});

  const dialogWidth = width || minWidth || triggerWidth || DEFAULT_DROPDOWN_WIDTH;
  const dialogHeight = getDropdownHeight(options, hasSearch, maxHeight, title);

  const handleClose = () => {
    onClose?.();
    setOpen(false);
  };

  const handleOpen = () => {
    if (onOpen) return onOpen?.();
    setOpen(true);
  };
  useEffect(() => {
    if (value === undefined || value === null || value === "" || value === 0) {
      setSelected(undefined);
      return;
    }

    if (typeof value === "object" && "id" in value && options?.length > 0) {
      const newVal = (options as DropdownOption<T>[]).find(
        ({ value: val }) => val && (val as { id?: number })?.id === value.id,
      )?.value;
      setSelected(newVal);
    } else if (typeof value === "object" && "value" in value && "name" in value) {
      setSelected(value.value as T);
    } else {
      setSelected(value as T);
    }
  }, [options, value]);

  useEffect(() => {
    if (isMultipleSelect) {
      if (selectedValues !== undefined && selectedValues?.length === 0) {
        setMultipleSelection([]);
      }
      if (selectedValues && selectedValues.length > 0) {
        const values = selectedValues.map((item) =>
          typeof item === "object" && "value" in (item || {}) && "name" in (item || {})
            ? ((item as DropdownOption<T>).value as T)
            : item,
        );
        setMultipleSelection(values?.map((val) => JSON.stringify(val)));
      }
    }
  }, [selectedValues, isMultipleSelect]);

  useEffect(() => {
    if (isOpen !== undefined && !open) {
      if (triggerRef.current) {
        setAnchorPosition(
          getDialogRenderPosition({
            rect: triggerRef.current.getBoundingClientRect(),
            alignDialog,
            dialogHeight,
            dialogWidth,
            offset,
          }),
        );
      }
      setOpen(isOpen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSelect = (
    option: DropdownOption<T>,
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
  ) => {
    const value = option.value;
    const stringVal = JSON.stringify(value);
    setSelected(value);
    onSelect?.(value, option);
    onChangeValue?.(value, option);

    if (isMultipleSelect) {
      const isSelected = multipleSelection.some((val) => val === stringVal);

      let newSelections: string[];

      if (isSelected) {
        newSelections = multipleSelection.filter((val) => val !== stringVal);
      } else {
        newSelections = [...multipleSelection, stringVal];
      }

      setMultipleSelection(newSelections);
      onSelectedValues?.(newSelections.map((val) => JSON.parse(val)));
    }

    if (!keepOpen) handleClose();
    event.stopPropagation();
  };

  const handleClickOpen = (
    event:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (readOnly) return;

    if (disabled) {
      onDisableClick?.();

      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const widthFromTrigger = rect?.width;
    // Ensure width is captured before computing position
    setTriggerWidth(widthFromTrigger);
    setAnchorPosition(
      getDialogRenderPosition({
        rect,
        alignDialog,
        dialogHeight,
        dialogWidth: widthFromTrigger || dialogWidth,
        offset,
      }),
    );
    handleOpen();
    event.stopPropagation();
  };

  const onClickTextField = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (readOnly) return;

    if (disabled) {
      onDisableClick?.();

      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const widthFromTrigger = rect?.width;
    const { left, top, right, bottom } = getDialogRenderPosition({
      rect,
      alignDialog,
      dialogHeight,
      dialogWidth: widthFromTrigger || dialogWidth,
      offset,
    });

    setAnchorPosition({ left, top: top ? top + 12 : top, right, bottom });

    setTriggerWidth(widthFromTrigger);
    handleOpen();
  };

  const handleSearch = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value || "";
    if (page !== 1) setPage(1);
    onSearch?.(value);
    setSearch(value.toLowerCase());
  };

  const filteredDropdownOptions: DropdownOption<T>[] = useMemo(() => {
    if (
      Array.isArray(options) &&
      options?.every(
        (value) =>
          typeof value == "string" || typeof value == "number" || typeof value == "boolean",
      )
    ) {
      if (onSearch) return options?.map((value) => ({ name: value, value }) as DropdownOption<T>);

      return options
        ?.filter((option) => option?.toString()?.toLowerCase().includes(search))
        ?.map((value) => ({ name: value, value }) as DropdownOption<T>);
    }

    if (onSearch) return options as DropdownOption<T>[];

    return ((options as DropdownOption<T>[]) || []).filter(
      ({ name, value }) =>
        name?.toString()?.toLowerCase()?.includes(search) ||
        value?.toString()?.toLowerCase()?.includes(search),
    );
  }, [options, search]);

  const dropdownOptions = useMemo(() => {
    if (onLoadMore) return filteredDropdownOptions;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    return filteredDropdownOptions?.slice(0, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDropdownOptions, page]);

  const displayValue = useMemo(() => {
    if (isMultipleSelect) {
      return multipleSelection
        ?.map((selectedValue) => {
          const selectedOption = filteredDropdownOptions.find(
            ({ value }) => JSON.stringify(value) === selectedValue,
          );

          return selectedOption ? selectedOption.name : "";
        })
        .join(", ");
    }

    const selectedOption = filteredDropdownOptions?.find(
      ({ value }) => JSON.stringify(value) == JSON.stringify(selected),
    );

    return selectedOption ? selectedOption?.name : "";
  }, [isMultipleSelect, filteredDropdownOptions, multipleSelection, selected]);

  const loadMoreOptions = async () => {
    if (onLoadMore) return;
    setPage((prevPage) => prevPage + 1);

    return Promise.resolve();
  };

  return {
    open,
    search,
    selected,
    handleClose,
    triggerWidth,
    triggerRef,
    handleSearch,
    anchorPosition,
    onClickTextField,
    multipleSelection,
    handleClickOpen,
    dropdownOptions,
    handleSelect,
    displayValue,
    dialogHeight,
    dialogWidth,
    loadMoreOptions: onLoadMore || loadMoreOptions,
    hasMoreOptions: onLoadMore
      ? hasMore
      : dropdownOptions?.length < filteredDropdownOptions?.length,
  };
}
