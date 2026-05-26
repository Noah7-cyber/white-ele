import React, { useState, ReactNode } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { MoreHoriz } from '@mui/icons-material';

interface ActionMenuItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ items }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (action: () => void) => {
    action();
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <MoreHoriz />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        container={document.body}
      >
        {items.map((item, idx) => (
          <MenuItem key={idx} onClick={() => handleItemClick(item.onClick)}>
            {item.icon && <span style={{ marginRight: 8 }}>{item.icon}</span>}
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
