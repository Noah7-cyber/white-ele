 
import classNames from 'classnames';
import React, { FC, ReactNode, useLayoutEffect, useState } from 'react';
import { Box, Modal as MUIModal, Slide, useMediaQuery, useTheme } from '@mui/material';

interface CustomModalProps {
  children?: ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
  id?: string;
  height?: number | string;
  width?: number | string;
  radius?: string;
  modalStyle?: object;
  contentStyle?: object;
  disableEnforceFocus?: boolean;
  defaultTop?: boolean;
  xsPadded?: number;
  maxHeight?: string | number;
  backdropBlur?: number;
  backdropColor?: string;
  anchorRef?: React.RefObject<HTMLElement | null>;
  position?: 'center' | 'anchor';
}

export const CustomModal: FC<CustomModalProps> = ({
  children,
  className,
  isOpen,
  onClose,
  modalStyle,
  contentStyle,
  disableEnforceFocus,
  defaultTop = true,
  height,
  width,
  radius,
  xsPadded = 0,
  maxHeight = '90vh',
  backdropBlur = 4,
  backdropColor = 'rgba(0,0,0,0.2)',
  anchorRef,
  position = 'center',
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [anchorPos, setAnchorPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (anchorRef?.current && isOpen && position === 'anchor') {
      const rect = anchorRef.current.getBoundingClientRect();
      setAnchorPos({
        top: rect.bottom + window.scrollY + 8, // 8px gap below
        left: rect.left + window.scrollX,
      });
    }
  }, [anchorRef, isOpen, position]);

  /** Backdrop styling */
  const defaultModalStyle = {
    display: 'flex',
    alignItems: isMobile ? 'flex-end' : 'center',
    justifyContent: 'center',
    backdropFilter: `blur(${backdropBlur}px)`,
    backgroundColor: backdropColor,
  };

    const anchoredStyle =
    position === 'anchor'
      ? {
          top: `${anchorPos.top}px`,
          left: `${anchorPos.left}px`,
          transform: 'none',
        }
      : {
          top: isMobile ? 'auto' : defaultTop ? '50%' : 'auto',
          left: isMobile ? 0 : '50%',
          transform: isMobile
            ? 'translate(0, 100%)'
            : defaultTop
              ? 'translate(-50%, -50%)'
              : 'translateX(-50%)',
        };

  /** Inner modal content styling */
  const defaultContentStyle = {
    width: { xs: '100%', sm: width || 'auto' },
    maxWidth: { xs: '100%', sm: '900px' },
    height: { xs: 'auto', sm: height || 'auto' },
    maxHeight: { xs: maxHeight, sm: 'auto' },
    overflowY: 'auto',
    scrollbarWidth: { xs: 'none', sm: 'auto' },
    '&::-webkit-scrollbar': { display: { xs: 'none', sm: 'block' } },
    bgcolor: 'white',
    borderRadius: { xs: radius || '16px 16px 0 0', sm: radius || '16px' },
    p: { xs: xsPadded, sm: 4 },
    position: 'absolute',
    bottom: isMobile ? 0 : 'auto',
    transition: 'transform 0.3s ease-in-out',
    outline: 'none',
    border: 'none',
    boxShadow: { xs: 24, sm: '0px 4px 24px rgba(0, 0, 0, 0.1)' },
    ...anchoredStyle,
  };

  const modalContent = (
    <Box
      sx={{ ...defaultContentStyle, ...contentStyle }}
      className={classNames('p-4', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Box>
  );

  return (
    <MUIModal
      open={isOpen}
      onClose={onClose}
      closeAfterTransition
      disableEnforceFocus={disableEnforceFocus}
      sx={{ ...defaultModalStyle, ...modalStyle }}
      {...props}
    >
      {isMobile ? (
        <Slide direction="up" in={isOpen} timeout={500} mountOnEnter unmountOnExit>
          {modalContent}
        </Slide>
      ) : (
        modalContent
      )}
    </MUIModal>
  );
};
