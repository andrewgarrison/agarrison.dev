import React, { forwardRef, MouseEventHandler } from "react";
import { organize } from "../../utils/tailwind-helpers";

interface LogoProps {
  children?: string;
  onClick?: MouseEventHandler;
  classes?: string[];
}

export const Logo = forwardRef<HTMLHeadingElement, LogoProps>(
  ({ children, onClick, classes = [], ...rest }, ref) => (
    <h5
      ref={ref}
      onClick={onClick}
      className={organize([
        "font-bold",
        "rounded-md",
        "border-2",
        "cursor-pointer",
        "w-11",
        "h-11",
        "flex",
        "items-center",
        "justify-center",
        "transition-all",
        "text-blue-600",
        "dark:text-blue-200",
        "border-blue-600",
        "dark:border-blue-200",
        ...classes,
      ])}
      {...rest}
    >
      {children || "a"}
    </h5>
  )
);

Logo.displayName = "Logo";
