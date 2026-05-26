import React from "react";

import CircularProgress from "@mui/material/CircularProgress";
import IconButton, { IconButtonProps } from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import classNames from "classnames";

import "./buttonIcon.css";

export enum ButtonSizes {
  small = "small",
  medium = "medium",
  large = "large",
}

export enum ButtonShapes {
  rounded = "rounded",
  default = "default",
}

export enum ButtonVariant {
  text = "text",
  outlined = "outlined",
  contained = "contained",
}

interface ButtonIconProps extends IconButtonProps {
  isLoading?: boolean;
  size?: ButtonSizes;
  variant?: ButtonVariant;
  shape?: ButtonShapes;
  color?: "default" | "inherit" | "primary" | "secondary";
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  tooltip?: string;
}

export const ButtonIcon: React.FC<ButtonIconProps> = ({
  isLoading,
  size = ButtonSizes.medium,
  variant = ButtonVariant.contained,
  shape = ButtonShapes.default,
  color = "default",
  disabled,
  onClick,
  tooltip,
  children,
  className,
  ...restProps
}) => {
  const sizeClass = {
    [ButtonSizes.small]: "w-8 h-8",
    [ButtonSizes.medium]: "w-10 h-10",
    [ButtonSizes.large]: "w-12 h-12",
  };

  const variantClass = {
    [ButtonVariant.text]: "bg-transparent",
    [ButtonVariant.outlined]: "bg-transparent border",
    [ButtonVariant.contained]: "bg-background text-white",
  };

  const shapeClass = {
    [ButtonShapes.rounded]: "rounded-full",
    [ButtonShapes.default]: "rounded-md",
  };

  const iconButton = (
    <IconButton
      {...restProps}
      size={size === ButtonSizes.small ? "small" : "medium"}
      color={color}
      disabled={isLoading || disabled}
      onClick={onClick}
      className={classNames(
        "relative flex items-center justify-center p-2",
        sizeClass[size],
        variantClass[variant],
        shapeClass[shape],
        className,
      )}
    >
      {!isLoading ? children : <CircularProgress size={24} className="absolute" />}
    </IconButton>
  );

  return tooltip ? <Tooltip title={tooltip}>{iconButton}</Tooltip> : iconButton;
};

export default ButtonIcon;
