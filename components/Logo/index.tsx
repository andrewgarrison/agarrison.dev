import { organize } from "../../utils/tailwind-helpers";

export const Logo = () => (
  <h5
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
      "hover:bg-blue-100",
      "dark:hover:bg-gray-700",
    ])}
  >
    a
  </h5>
);
