import React from "react";
import Link from "next/link";
import { organize } from "../../utils/tailwind-helpers";

interface BaseProps {
  children: React.ReactElement;
  href: string;
}

export const SocialLink = ({ children, href = "" }: BaseProps) => {
  const child = React.Children.only(children) as React.ReactElement;
  const styledChild = React.cloneElement(child, {
    className: organize([
      "text-gray-600",
      "dark:text-gray-200",
      "group-hover:text-blue-600",
      "dark:group-hover:text-blue-300",
      "transition-all",
    ]),
  });

  return (
    <Link href={href}>
      <a
        className={organize([
          "group",
          "rounded-full",
          "p-3",
          "mr-4",
          "border-2",
          "border-gray-600",
          "dark:border-gray-200",
          "hover:border-blue-600",
          "dark:hover:border-blue-300",
          "transition-all",
        ])}
      >
        {styledChild}
      </a>
    </Link>
  );
};
