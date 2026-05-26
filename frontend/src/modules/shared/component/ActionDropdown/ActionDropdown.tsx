"use client";

import { FC, useState, MouseEvent } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import MoreIcon from "@/modules/shared/assets/svgs/more.svg";
interface OptionProps {
  name: string;
  value: string | number;
}

interface ActionDropdownProps {
  options: OptionProps[];
  onSelect?: (event: OptionProps) => void;
}

const ActionDropdown: FC<ActionDropdownProps> = ({ options, onSelect }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (item: OptionProps) => {
    onSelect?.(item);
    handleClose();
  };

  return (
    <>
      <Button
        aria-controls={open ? "action-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        <MoreIcon />
      </Button>

      <Menu
        id="action-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {options.map((item) => (
          <MenuItem key={item.value} onClick={() => handleSelect(item)}>
            {item.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ActionDropdown;
